export class WaveGroupGenerator {
  constructor(random) {
    this.random = random;
    this.time = 0;
    this.groupIntensity = 1;
    this.targetIntensity = 1;
    this.transition = 1;
    this.nextChange = 18;
    this.irregularity = 0.16;
  }

  update(dt) {
    this.time += dt;
    if (this.time >= this.nextChange) {
      this.targetIntensity = this.random.range(0.72, 1.38);
      this.irregularity = this.random.range(0.08, 0.28);
      this.transition = 0;
      this.nextChange = this.time + this.random.range(18, 48);
    }

    this.transition = Math.min(1, this.transition + dt * 0.15);
    const smooth = this.transition * this.transition * (3 - 2 * this.transition);
    this.groupIntensity += (this.targetIntensity - this.groupIntensity) * smooth * Math.min(1, dt * 0.8);

    const micro =
      Math.sin(this.time * 0.31) * this.irregularity * 0.32 +
      Math.sin(this.time * 0.117 + 1.7) * this.irregularity * 0.22;

    return Math.max(0.55, Math.min(1.55, this.groupIntensity + micro));
  }

  serialize() {
    return {
      time: this.time,
      groupIntensity: this.groupIntensity,
      targetIntensity: this.targetIntensity,
      transition: this.transition,
      nextChange: this.nextChange,
      irregularity: this.irregularity
    };
  }

  hydrate(value = {}) {
    Object.assign(this, value);
  }
}
