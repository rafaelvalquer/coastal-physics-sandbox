import { MATERIALS } from "../../engine/world/materials.js";

const WORLD_PIXELS_PER_BUILD_METER = 12;

export class PhysicsConstructionAdapter {
  constructor(engine) {
    this.engine = engine;
    this.snapshots = new Map();
    this.drains = new Map();
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

      if (construction.type === "VEGETATION") {
        const index = terrain.index(column, top);
        remember(column, top);
        terrain.vegetation[index] = Math.max(terrain.vegetation[index], 0.85);
        terrain.rootStrength[index] = Math.max(terrain.rootStrength[index], 0.75);
        continue;
      }

      if (construction.type === "DRAINAGE") {
        this.drains.set(construction.id, {
          index: Math.max(0, Math.min(this.engine.water.n - 1, Math.floor(worldX / this.engine.water.dx))),
          capacity: construction.capacity || 2.5
        });
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

    this.snapshots.set(construction.id, changes);
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
    this.drains.delete(construction.id);
    this.engine.water.refreshBed();
  }

  update(dt) {
    const water = this.engine.water;
    for (const drain of this.drains.values()) {
      const source = drain.index;
      if (water.h[source] <= 0.05) continue;
      const removal = Math.min(water.h[source], drain.capacity * dt * 0.12);
      water.h[source] -= removal;
      const outlet = Math.max(0, source - 24);
      water.h[outlet] += removal * 0.97;
      water.sediment[outlet] += water.sediment[source] * 0.001 * removal;
    }
  }
}
