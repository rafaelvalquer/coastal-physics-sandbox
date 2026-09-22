export class CFLController {
  constructor({ cfl = 0.78, maxSubsteps = 12, minDt = 1 / 4000 } = {}) {
    this.cfl = cfl;
    this.maxSubsteps = maxSubsteps;
    this.minDt = minDt;
    this.lastMaxCharacteristic = 0;
    this.lastSubsteps = 1;
    this.lastCfl = 0;
  }

  maxCharacteristic(h, hu, g) {
    let max = 0;
    for (let i = 0; i < h.length; i++) {
      if (h[i] <= 1e-8) continue;
      const u = hu[i] / h[i];
      max = Math.max(max, Math.abs(u) + Math.sqrt(g * h[i]));
    }
    this.lastMaxCharacteristic = max;
    return max;
  }

  substeps(dt, dx, h, hu, g) {
    const speed = this.maxCharacteristic(h, hu, g);
    if (speed <= 1e-9) {
      this.lastSubsteps = 1;
      this.lastCfl = 0;
      return 1;
    }
    const stableDt = Math.max(this.minDt, this.cfl * dx / speed);
    const steps = Math.max(1, Math.min(this.maxSubsteps, Math.ceil(dt / stableDt)));
    this.lastSubsteps = steps;
    this.lastCfl = speed * (dt / steps) / dx;
    return steps;
  }
}
