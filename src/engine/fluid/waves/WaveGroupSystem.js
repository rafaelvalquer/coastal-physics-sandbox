export class WaveGroupSystem {
  constructor() { this.intensity = 1; }
  update(generator, timeSeconds) {
    this.intensity = generator?.groupIntensity?.(timeSeconds) ?? 1;
    return this.intensity;
  }
}
