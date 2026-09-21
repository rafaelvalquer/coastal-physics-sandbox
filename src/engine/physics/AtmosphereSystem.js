import { smoothNoise1D } from '../utils/math.js';

export class AtmosphereSystem {
  constructor() {
    this.time = 0;
    this.wind = 8;
    this.gustiness = 0.28;
    this.rain = 0;
    this.tide = 0;
  }

  update(dt) {
    this.time += dt;
  }

  windAt(normalizedX = 0.5) {
    const slowGust = smoothNoise1D(this.time * 0.11 + normalizedX * 0.7, 221);
    const turbulent = smoothNoise1D(this.time * 0.73 + normalizedX * 4.8, 917);
    const gust = 1 + this.gustiness * (0.62 * slowGust + 0.38 * turbulent);
    return this.wind * Math.max(0.15, gust);
  }

  serialize() {
    return {
      time: this.time,
      wind: this.wind,
      gustiness: this.gustiness,
      rain: this.rain,
      tide: this.tide
    };
  }

  hydrate(data) {
    if (!data) return;
    this.time = Number(data.time || 0);
    this.wind = Number(data.wind ?? 8);
    this.gustiness = Number(data.gustiness ?? 0.28);
    this.rain = Number(data.rain ?? 0);
    this.tide = Number(data.tide ?? 0);
  }
}
