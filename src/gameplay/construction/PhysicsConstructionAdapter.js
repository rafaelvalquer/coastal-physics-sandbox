import { MATERIALS } from "../../engine/world/materials.js";

const WORLD_PIXELS_PER_BUILD_METER = 12;

export class PhysicsConstructionAdapter {
  constructor(engine, eventBus = null) {
    this.engine = engine;
    this.eventBus = eventBus;
    this.snapshots = new Map();
    this.drains = new Map();
    this.footprints = new Map();
  }

  apply(construction) {
    const terrain = this.engine.terrain;
    const span = Math.max(
      terrain.cellSize,
      Math.min(360, construction.length * WORLD_PIXELS_PER_BUILD_METER)
    );
    const startX = construction.x - span / 2;
    const endX = construction.x + span / 2;
    const changes = [];
    const columns = [];
    const drainIndices = [];

    const remember = (x, y) => {
      if (!terrain.inBounds(x, y)) return;
      const index = terrain.index(x, y);
      changes.push({
        x,
        y,
        material: terrain.material[index],
        integrity: terrain.integrity[index],
        moisture: terrain.moisture[index],
        vegetation: terrain.vegetation?.[index] || 0,
        rootStrength: terrain.rootStrength?.[index] || 0
      });
    };

    for (let worldX = startX; worldX <= endX; worldX += terrain.cellSize) {
      const column = terrain.worldToCell(worldX, construction.y).x;
      const top = terrain.columnTopCell(column);
      if (top >= terrain.rows) continue;
      if (!columns.some((item) => item.x === column)) columns.push({ x: column, baselineTop: top });

      if (construction.type === "VEGETATION") {
        const index = terrain.index(column, top);
        remember(column, top);
        terrain.vegetation[index] = Math.max(terrain.vegetation[index], 0.3);
        terrain.rootStrength[index] = Math.max(terrain.rootStrength[index], 0.15);
        continue;
      }

      if (construction.type === "DRAINAGE") {
        const waterIndex = Math.max(
          0,
          Math.min(this.engine.water.n - 1, Math.floor(worldX / this.engine.water.dx))
        );
        if (!drainIndices.includes(waterIndex)) drainIndices.push(waterIndex);
        continue;
      }

      let material = null;
      let heightCells = 1;

      if (construction.type === "CONCRETE_WALL") {
        material = MATERIALS.CONCRETE;
        heightCells = Math.max(2, Math.round(construction.height * 0.7));
      } else if (construction.type === "RIPRAP") {
        material = MATERIALS.ROCK;
        heightCells = 2;
      } else if (construction.type === "DUNE") {
        material = MATERIALS.SAND;
        heightCells = Math.max(2, Math.round(construction.height * 0.65));
      } else if (construction.type === "BREAKWATER") {
        material = MATERIALS.ROCK;
        heightCells = Math.max(2, Math.round(construction.height * 0.8));
      }

      if (!material) continue;

      for (let offset = 1; offset <= heightCells; offset++) {
        const y = Math.max(0, top - offset);
        remember(column, y);
        terrain.setCell(
          column,
          y,
          material.id,
          construction.type === "DUNE" ? 0.8 : 1,
          construction.type === "DUNE" ? 0.35 : 0.05
        );
      }

      if (construction.type === "RIPRAP" || construction.type === "BREAKWATER") {
        const baseIndex = terrain.index(column, top);
        remember(column, top);
        terrain.integrity[baseIndex] = Math.min(1, terrain.integrity[baseIndex] + 0.15);
      }
    }

    if (drainIndices.length) {
      this.drains.set(construction.id, {
        indices: drainIndices,
        capacity: construction.capacity || 2.5,
        overflowing: false
      });
    }

    this.snapshots.set(construction.id, changes);
    this.footprints.set(construction.id, {
      columns: columns.map((column) => ({
        ...column,
        builtTop: terrain.columnTopCell(column.x)
      })),
      type: construction.type
    });
    this.engine.water.refreshBed();
  }

  remove(construction) {
    const terrain = this.engine.terrain;
    const changes = this.snapshots.get(construction.id) || [];
    for (const old of changes.reverse()) {
      terrain.setCell(old.x, old.y, old.material, old.integrity, old.moisture);
      const index = terrain.index(old.x, old.y);
      if (terrain.vegetation) terrain.vegetation[index] = old.vegetation;
      if (terrain.rootStrength) terrain.rootStrength[index] = old.rootStrength;
    }
    this.snapshots.delete(construction.id);
    this.footprints.delete(construction.id);
    this.drains.delete(construction.id);
    this.engine.water.refreshBed();
  }

  updateFoundationExposure(construction) {
    const terrain = this.engine.terrain;
    const footprint = this.footprints.get(construction.id);
    if (!footprint?.columns?.length) return;

    let unsupported = 0;
    for (const column of footprint.columns) {
      if (!terrain.inBounds(column.x, column.baselineTop)) {
        unsupported++;
        continue;
      }
      const material = terrain.getMaterial(column.x, column.baselineTop);
      const index = terrain.index(column.x, column.baselineTop);
      const integrity = terrain.integrity[index] || 0;
      if (!material.solid || integrity < 0.2) unsupported++;
    }

    construction.foundationExposure = unsupported / footprint.columns.length;
  }

  updateVegetation(construction, dt) {
    const terrain = this.engine.terrain;
    const footprint = this.footprints.get(construction.id);
    if (!footprint) return;

    for (const column of footprint.columns) {
      const top = terrain.columnTopCell(column.x);
      if (top >= terrain.rows) continue;
      const index = terrain.index(column.x, top);
      const growth = (construction.growthRate || 0.004) * dt;
      terrain.vegetation[index] = Math.min(1, (terrain.vegetation[index] || 0) + growth);
      terrain.rootStrength[index] = Math.min(
        1,
        (terrain.rootStrength[index] || 0) + growth * 0.65
      );
    }
  }

  updateDrainage(construction, dt) {
    const drain = this.drains.get(construction.id);
    if (!drain?.indices?.length) return;

    const water = this.engine.water;
    const capacityPerIndex = drain.capacity / drain.indices.length;
    let requested = 0;
    let moved = 0;

    for (const source of drain.indices) {
      if (water.h[source] <= 0.05) continue;
      const available = water.h[source];
      const removal = Math.min(available, capacityPerIndex * dt * 0.12);
      requested += available;
      moved += removal;
      water.h[source] -= removal;

      let outlet = Math.max(0, source - 8);
      while (outlet > 0 && water.bed[outlet] >= water.baseSeaElevation - 2) outlet--;
      water.h[outlet] += removal * 0.97;
      water.sediment[outlet] += water.sediment[source] * 0.001 * removal;
    }

    const overflowing = requested > moved * 1.5 && requested > 0.5;
    construction.overflowing = overflowing;
    if (overflowing && !drain.overflowing) {
      this.eventBus?.emit("drainage:overflow", { constructionId: construction.id });
    }
    drain.overflowing = overflowing;
  }

  updateHydraulicDissipation(construction, dt) {
    if (construction.type !== "RIPRAP" && construction.type !== "BREAKWATER") return;
    const water = this.engine.water;
    const footprint = this.footprints.get(construction.id);
    if (!footprint?.columns?.length) return;

    const dissipation = Math.max(0, Math.min(1, construction.dissipation || 0));
    const permeability = Math.max(0, Math.min(1, construction.permeability ?? 0.5));
    const roughness = construction.type === "BREAKWATER" ? (construction.roughness || 0.8) : (construction.friction || 0.7);
    const dragRate = (0.45 + roughness * 0.8) * dissipation * (1 - permeability * 0.42);
    const damping = Math.exp(-dt * dragRate);

    for (const column of footprint.columns) {
      const worldX = (column.x + 0.5) * this.engine.terrain.cellSize;
      const index = Math.max(0, Math.min(water.n - 1, Math.floor(worldX / water.dx)));
      if (water.h[index] <= 0.05) continue;
      water.q[index] *= damping;
      if (index + 1 < water.n) water.q[index + 1] *= Math.sqrt(damping);
      if (index > 0) water.q[index - 1] *= Math.sqrt(damping);

      const waves = this.engine.surfaceWaves;
      if (waves) {
        waves.velocity[index] *= damping;
        waves.displacement[index] *= 0.995 + 0.005 * damping;
      }
    }
  }

  updateDuneCondition(construction) {
    if (construction.type !== "DUNE") return;
    const terrain = this.engine.terrain;
    const footprint = this.footprints.get(construction.id);
    if (!footprint?.columns?.length) return;

    let ratio = 0;
    for (const column of footprint.columns) {
      const currentTop = terrain.columnTopCell(column.x);
      const expectedHeight = Math.max(1, column.baselineTop - column.builtTop);
      const remainingHeight = Math.max(0, column.baselineTop - currentTop);
      ratio += Math.min(1, remainingHeight / expectedHeight);
    }
    ratio /= footprint.columns.length;
    construction.condition = Math.min(construction.condition, Math.max(0, ratio));
    construction.remainingDuneVolume = ratio;
  }

  updateWaveWear(construction, dt) {
    if (construction.type !== "RIPRAP" && construction.type !== "BREAKWATER") return;
    const water = this.engine.water;
    const index = Math.max(0, Math.min(water.n - 1, Math.floor(construction.x / water.dx)));
    const speed = Math.abs(water.velocityAtIndex(index)) / 48;
    const depth = (water.h[index] || 0) / 48;

    if (construction.type === "RIPRAP") {
      const threshold = construction.displacementThreshold || 2.4;
      if (depth > 0.2 && speed > threshold) {
        construction.condition = Math.max(
          0,
          construction.condition - (speed - threshold) * dt * 0.003
        );
        construction.displacement = Math.min(
          1,
          (construction.displacement || 0) + (speed - threshold) * dt * 0.002
        );
      }
    } else {
      const pressure = 0.5 * 1000 * speed * speed;
      const threshold = 1800 * (construction.resistance || 1);
      if (pressure > threshold) {
        construction.condition = Math.max(
          0,
          construction.condition - ((pressure - threshold) / 100000) * dt
        );
      }
    }
  }

  update(dt, constructions = []) {
    for (const construction of constructions) {
      if (!construction.operational) continue;
      this.updateFoundationExposure(construction);
      if (construction.type === "VEGETATION") this.updateVegetation(construction, dt);
      if (construction.type === "DRAINAGE") this.updateDrainage(construction, dt);
      if (construction.type === "DUNE") this.updateDuneCondition(construction);
      this.updateHydraulicDissipation(construction, dt);
      this.updateWaveWear(construction, dt);

      if (construction.condition <= 0) {
        construction.operational = false;
        this.eventBus?.emit("construction:failed", { constructionId: construction.id });
      }
    }
  }
}
