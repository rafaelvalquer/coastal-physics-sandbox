export class WaveSpectrum {
  constructor({ significantWaveHeight = 2, peakPeriod = 8, seed = 1, components = 24 } = {}) {
    this.significantWaveHeight = significantWaveHeight;
    this.peakPeriod = peakPeriod;
    this.seed = seed >>> 0;
    this.components = components;
  }

  random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
}
