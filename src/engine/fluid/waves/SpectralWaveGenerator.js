import { JonswapSpectrum } from "./JonswapSpectrum.js";

export class SpectralWaveGenerator {
  constructor({ significantWaveHeight = 2, peakPeriod = 8, seed = 1, direction = 90 } = {}) {
    this.configure({ significantWaveHeight, peakPeriod, seed, direction });
  }

  configure({ significantWaveHeight = this.significantWaveHeight, peakPeriod = this.peakPeriod, seed = this.seed, direction = this.direction } = {}) {
    this.significantWaveHeight = Math.max(0.05, Number(significantWaveHeight));
    this.peakPeriod = Math.max(2.5, Number(peakPeriod));
    this.seed = Math.max(1, Math.floor(Number(seed) || 1));
    this.direction = Number(direction || 90);
    this.spectrum = new JonswapSpectrum({
      significantWaveHeight: this.significantWaveHeight,
      peakPeriod: this.peakPeriod,
      seed: this.seed,
      components: 28
    });
    this.components = this.spectrum.generate();
  }

  elevationAt(timeSeconds) {
    let eta = 0;
    for (const c of this.components) eta += c.amplitude * Math.sin(c.omega * timeSeconds + c.phase);
    return eta;
  }

  orbitalVelocityAt(timeSeconds, depthMeters = 8) {
    const h = Math.max(0.2, depthMeters);
    let u = 0;
    for (const c of this.components) {
      const k = Math.max(0.02, c.omega / Math.sqrt(9.81 * h));
      const scale = Math.min(3, c.omega * Math.cosh(k * h) / Math.max(1e-6, Math.sinh(k * h)));
      u += c.amplitude * scale * Math.cos(c.omega * timeSeconds + c.phase);
    }
    return u;
  }

  groupIntensity(timeSeconds) {
    const envelope = Math.abs(this.elevationAt(timeSeconds)) / Math.max(0.05, this.significantWaveHeight);
    return Math.max(0.55, Math.min(1.45, 0.78 + envelope * 0.6));
  }
}
