const PX_PER_METER = 48;

export class BreakingWaveSystem {
  constructor(size) {
    this.intensity = new Float32Array(size);
    this.dissipatedEnergy = 0;
  }

  update(dt, water, shoaling, significantWaveHeightMeters = 1) {
    let dissipated = 0;
    for (let i = 1; i < water.n - 1; i++) {
      const depthMeters = water.h[i] / PX_PER_METER;
      if (depthMeters <= 0.01) {
        this.intensity[i] *= Math.exp(-dt * 8);
        continue;
      }
      const localWaveHeight = significantWaveHeightMeters * (shoaling?.[i] || 1);
      const breakerRatio = localWaveHeight / Math.max(0.05, depthMeters);
      const u = Math.abs(water.velocityAtIndex(i)) / PX_PER_METER;
      const froude = u / Math.max(0.05, Math.sqrt(9.81 * depthMeters));
      const target = Math.max(0, Math.min(1, Math.max((breakerRatio - 0.62) / 0.28, (froude - 0.75) / 0.7)));
      this.intensity[i] += (target - this.intensity[i]) * (1 - Math.exp(-dt * 8));
      if (this.intensity[i] > 0.02) {
        const before = Math.abs(water.q[i]);
        const damping = Math.exp(-dt * (0.45 + 3.8 * this.intensity[i]));
        water.q[i] *= damping;
        dissipated += Math.max(0, before - Math.abs(water.q[i]));
      }
    }
    this.dissipatedEnergy += dissipated;
    return dissipated;
  }
}
