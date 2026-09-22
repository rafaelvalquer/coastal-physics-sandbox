export class WaterDiagnostics {
  constructor({ mass, momentum, energy, cfl }) { Object.assign(this, { mass, momentum, energy, cfl }); this.nanCount = 0; this.negativeDepthCount = 0; }
  scan(h, hu) {
    let nan = 0, negative = 0;
    for (let i = 0; i < h.length; i++) {
      if (!Number.isFinite(h[i]) || !Number.isFinite(hu[i])) nan++;
      if (h[i] < -1e-8) negative++;
    }
    this.nanCount = nan; this.negativeDepthCount = negative;
    return this.snapshot();
  }
  snapshot() { return { mass: this.mass.snapshot(), momentum: this.momentum.snapshot(), energy: this.energy.snapshot(), cfl: { value: this.cfl.lastCfl, substeps: this.cfl.lastSubsteps, maxCharacteristic: this.cfl.lastMaxCharacteristic }, nanCount: this.nanCount, negativeDepthCount: this.negativeDepthCount }; }
}
