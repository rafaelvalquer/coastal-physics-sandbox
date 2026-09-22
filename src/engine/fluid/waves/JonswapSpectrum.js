import { WaveSpectrum } from "./WaveSpectrum.js";

const G = 9.81;
const TWO_PI = Math.PI * 2;

export class JonswapSpectrum extends WaveSpectrum {
  density(frequencyHz) {
    const fp = 1 / Math.max(2.5, this.peakPeriod);
    const f = Math.max(0.02, frequencyHz);
    const sigma = f <= fp ? 0.07 : 0.09;
    const r = Math.exp(-Math.pow(f - fp, 2) / (2 * sigma * sigma * fp * fp));
    const gamma = 3.3;
    const alpha = 0.0081;
    const pm = alpha * G * G * Math.pow(TWO_PI, -4) * Math.pow(f, -5) * Math.exp(-1.25 * Math.pow(fp / f, 4));
    return pm * Math.pow(gamma, r);
  }

  generate() {
    const fp = 1 / Math.max(2.5, this.peakPeriod);
    const fMin = Math.max(0.025, fp * 0.42);
    const fMax = fp * 2.8;
    const df = (fMax - fMin) / Math.max(1, this.components - 1);
    const components = [];
    let variance = 0;

    for (let i = 0; i < this.components; i++) {
      const f = fMin + i * df;
      const spectral = Math.max(0, this.density(f));
      const amplitude = Math.sqrt(2 * spectral * df);
      variance += amplitude * amplitude / 2;
      components.push({
        frequency: f,
        omega: TWO_PI * f,
        amplitude,
        phase: this.random() * TWO_PI
      });
    }

    const targetVariance = Math.pow(this.significantWaveHeight / 4, 2);
    const scale = Math.sqrt(targetVariance / Math.max(1e-12, variance));
    for (const c of components) c.amplitude *= scale;
    return components;
  }
}
