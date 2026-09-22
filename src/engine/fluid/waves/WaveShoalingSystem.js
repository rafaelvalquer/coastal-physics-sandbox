const PX_PER_METER = 48;

export class WaveShoalingSystem {
  constructor(size) {
    this.factor = new Float32Array(size);
    this.factor.fill(1);
  }

  update(water, significantWaveHeightMeters = 1) {
    const offshoreDepth = Math.max(1, water.h[0] / PX_PER_METER);
    for (let i = 0; i < water.n; i++) {
      const depth = Math.max(0.05, water.h[i] / PX_PER_METER);
      const shallow = Math.sqrt(Math.max(0.05, offshoreDepth / Math.max(0.05, depth)));
      const limit = 0.78 * depth / Math.max(0.05, significantWaveHeightMeters);
      this.factor[i] = Math.max(0.55, Math.min(1.65, shallow, Math.max(0.35, limit)));
    }
    return this.factor;
  }
}
