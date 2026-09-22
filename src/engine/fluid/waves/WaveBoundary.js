const PX_PER_METER = 48;

export class WaveBoundary {
  constructor({ generator, direction = 90 } = {}) {
    this.generator = generator;
    this.direction = direction;
  }

  sample(timeSeconds, depthMeters = 8) {
    const dir = Math.max(0.15, Math.abs(Math.cos((this.direction - 90) * Math.PI / 180)));
    const elevationMeters = this.generator.elevationAt(timeSeconds) * dir;
    const orbitalVelocityMeters = this.generator.orbitalVelocityAt(timeSeconds, depthMeters) * dir;
    return {
      elevationMeters,
      elevationPx: elevationMeters * PX_PER_METER,
      velocityMeters: orbitalVelocityMeters,
      velocityPx: orbitalVelocityMeters * PX_PER_METER,
      signal: elevationMeters / Math.max(0.05, this.generator.significantWaveHeight / 2),
      groupIntensity: this.generator.groupIntensity(timeSeconds)
    };
  }
}
