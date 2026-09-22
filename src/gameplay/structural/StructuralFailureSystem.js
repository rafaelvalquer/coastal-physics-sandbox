import { WORLD } from "../../engine/world/constants.js";

export class StructuralFailureSystem {
  constructor({ eventBus, rigidBodies = null, grid = null, graph = null, terrain = null, water = null } = {}) {
    Object.assign(this, { eventBus, rigidBodies, grid, graph, terrain, water });
  }

  dominantMode(stability) {
    if (!stability) return "DAMAGE";
    return [
      ["SLIDING", stability.sliding?.factor ?? 99],
      ["OVERTURNING", stability.overturning?.factor ?? 99],
      ["UPLIFT", stability.uplift?.factor ?? 99],
      ["FOUNDATION_FAILURE", stability.foundation?.factor ?? 99]
    ].sort((a, b) => a[1] - b[1])[0][0];
  }

  beginFailure(assembly, { mode = null, severity = 0.5, impulseX = null } = {}) {
    if (assembly.fractured || assembly.collapseState === "FALLING") return false;
    const stability = assembly.stability;
    const velocityMeters = stability?.forces?.velocity || 0;
    const direction = Math.sign(velocityMeters || impulseX || 1);

    assembly.failed = true;
    assembly.failureMode = mode || this.dominantMode(stability);
    assembly.collapseState = "FALLING";
    assembly.failureElapsed = 0;
    assembly.restCenter ||= { ...assembly.centerOfMass };
    assembly.velocityX += Number.isFinite(impulseX)
      ? impulseX
      : direction * (18 + 62 * Math.max(0.15, severity));
    assembly.velocityY -= 4 + severity * 12;
    assembly.angularVelocity += direction * (0.22 + severity * 0.65);
    assembly.condition = Math.max(0, assembly.condition - 0.28 * Math.max(0.25, severity));

    for (const block of assembly.blocks) {
      block.integrity = Math.max(0.08, block.integrity - 0.16 - severity * 0.18);
    }

    if (this.graph) {
      const ids = new Set(assembly.blocks.map((block) => block.id));
      for (const connection of this.graph.connections.values()) {
        if (ids.has(connection.a) && ids.has(connection.b)) {
          connection.integrity = Math.max(0.05, connection.integrity - 0.35 - severity * 0.45);
        }
      }
    }

    this.eventBus?.emit("structural:failed", {
      assemblyId: assembly.id,
      buildingId: assembly.buildingId || null,
      mode: assembly.failureMode,
      stability,
      collapseState: assembly.collapseState
    });
    return true;
  }

  applyProgressiveInstability(assembly, dt) {
    const stability = assembly.stability;
    if (!stability || assembly.failed) return;

    if ((stability.sliding?.factor ?? 99) < 1) {
      const severity = Math.min(1, 1 - stability.sliding.factor);
      const direction = stability.forces?.velocity >= 0 ? 1 : -1;
      const displacement = direction * severity * dt * 5;
      assembly.displacementX += displacement;
      for (const block of assembly.blocks) block.displacementX += displacement;
    }

    if ((stability.overturning?.factor ?? 99) < 1) {
      const severity = Math.min(1, 1 - stability.overturning.factor);
      const direction = stability.forces?.velocity >= 0 ? 1 : -1;
      assembly.angularVelocity += direction * severity * dt * 0.42;
      assembly.rotation += assembly.angularVelocity * dt;
      for (const block of assembly.blocks) block.rotation = assembly.rotation;
    } else {
      assembly.angularVelocity *= Math.exp(-dt * 2.4);
    }

    const minimum = stability.minimumFactor ?? 99;
    if (minimum < 0.7 || Math.abs(assembly.rotation) > 0.32) {
      this.beginFailure(assembly, {
        severity: Math.min(1, Math.max(0.2, 1 - minimum))
      });
    }
  }

  updateFallingAssembly(assembly, dt) {
    if (assembly.collapseState !== "FALLING" || assembly.fractured) return;
    assembly.failureElapsed += dt;

    let ax = 0;
    let ay = WORLD.gravity * 0.42;
    if (this.water) {
      const flow = this.water.velocityAtX?.(assembly.centerOfMass.x) || 0;
      const surfaceY = this.water.surfaceYAtX?.(assembly.centerOfMass.x) ?? WORLD.height;
      const submerged = Math.max(0, Math.min(1, (assembly.centerOfMass.y - surfaceY + assembly.heightMeters * 24) / Math.max(12, assembly.heightMeters * 48)));
      ax += (flow - assembly.velocityX) * submerged * 0.7;
      ay *= 1 - submerged * 0.72;
    }

    assembly.velocityX += ax * dt;
    assembly.velocityY += ay * dt;
    const dx = assembly.velocityX * dt;
    const dy = assembly.velocityY * dt;
    assembly.displacementX += dx;
    assembly.displacementY += dy;
    assembly.rotation += assembly.angularVelocity * dt;
    assembly.angularVelocity *= Math.exp(-dt * 0.22);

    for (const block of assembly.blocks) {
      block.displacementX += dx;
      block.displacementY += dy;
      block.rotation = assembly.rotation;
    }

    let groundContact = false;
    if (this.terrain && assembly.bounds) {
      const groundY = this.terrain.columnTopWorldYAt(assembly.centerOfMass.x);
      groundContact = assembly.bounds.maxY + Math.max(0, dy) >= groundY - 2;
      if (groundContact) {
        assembly.velocityY *= -0.08;
        assembly.angularVelocity *= 0.78;
      }
    }

    const stabilityMinimum = assembly.stability?.minimumFactor ?? 1;
    const shouldFracture =
      assembly.failureElapsed > 0.72 &&
      (groundContact || Math.abs(assembly.rotation) > 0.42 || stabilityMinimum < 0.38 || assembly.integrity < 0.42);

    if (shouldFracture) this.fracture(assembly);
  }

  fracture(assembly) {
    if (assembly.fractured) return false;
    assembly.fractured = true;
    assembly.collapseState = "FRACTURED";
    assembly.condition = 0;

    const active = assembly.blocks.filter((block) => block.integrity > 0);
    const candidates = active.length <= 8
      ? active
      : active.filter((_, index) => index % Math.ceil(active.length / 8) === 0).slice(0, 8);

    for (const [index, block] of candidates.entries()) {
      const center = this.grid ? block.worldCenter(this.grid) : assembly.centerOfMass;
      const material = block.debrisMaterial ||
        (block.type.includes("WOOD") ? "wood" :
          block.type.includes("ROOF") ? "tile" : "concrete");
      const tangential = assembly.angularVelocity * ((index % 2 ? 1 : -1) * block.width * 24);
      const config = {
        x: center.x,
        y: center.y,
        width: Math.max(8, block.width * 48),
        height: Math.max(6, block.height * 48),
        density: block.density || (material === "wood" ? 620 : 2300),
        material,
        vx: assembly.velocityX + tangential + (index - candidates.length / 2) * 3,
        vy: assembly.velocityY - 8 - (index % 3) * 4,
        angle: block.rotation || assembly.rotation,
        angularVelocity: assembly.angularVelocity + (index % 2 ? 0.7 : -0.55),
        sourceAssemblyId: assembly.id,
        shape: block.type === "ROOF_PANEL" ? "box" : "box"
      };
      if (this.rigidBodies?.spawnDebris) this.rigidBodies.spawnDebris(config);
      else this.rigidBodies?.spawn?.(config.x, config.y, config.width, config.height, config.density, config.material);
      block.integrity = 0;
      block.connected = false;
    }

    if (this.graph) {
      const ids = new Set(assembly.blocks.map((block) => block.id));
      for (const [id, connection] of this.graph.connections) {
        if (ids.has(connection.a) || ids.has(connection.b)) {
          connection.integrity = 0;
          this.graph.connections.delete(id);
        }
      }
    }

    this.eventBus?.emit("structural:fractured", {
      assemblyId: assembly.id,
      buildingId: assembly.buildingId || null,
      mode: assembly.failureMode,
      debrisCount: candidates.length
    });
    return true;
  }

  forceFailure(assembly, mode = "DAMAGE", severity = 1) {
    if (!assembly) return false;
    return this.beginFailure(assembly, { mode, severity });
  }

  update(assembly, dt) {
    if (!assembly || assembly.fractured) return;
    this.applyProgressiveInstability(assembly, dt);
    this.updateFallingAssembly(assembly, dt);
  }
}
