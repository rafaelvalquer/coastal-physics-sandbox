export class StabilityResult {
  constructor({ sliding, overturning, uplift, foundation, forces }) {
    this.sliding = sliding;
    this.overturning = overturning;
    this.uplift = uplift;
    this.foundation = foundation;
    this.forces = forces;
    this.minimumFactor = Math.min(
      sliding.factor,
      overturning.factor,
      uplift.factor,
      foundation.factor
    );
    this.state = this.minimumFactor >= 1.5
      ? "SAFE"
      : this.minimumFactor >= 1.2
        ? "WARNING"
        : this.minimumFactor >= 1
          ? "CRITICAL"
          : "FAILING";
  }

  serialize() {
    return JSON.parse(JSON.stringify(this));
  }
}
