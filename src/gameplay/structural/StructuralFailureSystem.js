export class StructuralFailureSystem {
  constructor({ eventBus, rigidBodies = null }) {
    this.eventBus = eventBus;
    this.rigidBodies = rigidBodies;
  }

  update(assembly, dt) {
    const stability = assembly.stability;
    if (!stability || assembly.failed) return;

    if (stability.sliding.factor < 1) {
      const severity = Math.min(1, 1 - stability.sliding.factor);
      const direction = stability.forces.velocity >= 0 ? 1 : -1;
      const displacement = direction * severity * dt * 4;
      assembly.displacementX += displacement;
      for (const block of assembly.blocks) block.displacementX += displacement;
    }

    if (stability.overturning.factor < 1) {
      const severity = Math.min(1, 1 - stability.overturning.factor);
      assembly.angularVelocity += severity * dt * 0.32;
      assembly.rotation += assembly.angularVelocity * dt;
      for (const block of assembly.blocks) block.rotation = assembly.rotation;
    } else {
      assembly.angularVelocity *= Math.exp(-dt * 2.4);
    }

    const minimum = stability.minimumFactor;
    if (minimum < 0.7 || Math.abs(assembly.rotation) > 0.32) {
      const modes = [
        ["SLIDING", stability.sliding.factor],
        ["OVERTURNING", stability.overturning.factor],
        ["UPLIFT", stability.uplift.factor],
        ["FOUNDATION_FAILURE", stability.foundation.factor]
      ].sort((a, b) => a[1] - b[1]);

      assembly.failed = true;
      assembly.failureMode = modes[0][0];
      assembly.condition = Math.max(0, assembly.condition - 0.45);
      for (const block of assembly.blocks) {
        block.integrity = Math.max(0.15, block.integrity - 0.35);
        block.connected = false;
      }
      this.eventBus?.emit("structural:failed", {
        assemblyId: assembly.id,
        mode: assembly.failureMode,
        stability
      });
    }
  }
}
