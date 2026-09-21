export class WaterUtilitySystem {
  constructor() {
    this.capacity = 200;
    this.demand = 0;
    this.operational = true;
    this.contamination = 0;
  }

  update({ population = 0, flooded = false }) {
    this.demand = population * 0.2;
    if (flooded) this.contamination = Math.min(1, this.contamination + 0.02);
    else this.contamination = Math.max(0, this.contamination - 0.002);
    this.operational = this.capacity >= this.demand && this.contamination < 0.7;
    return this.snapshot();
  }

  snapshot() {
    return {
      operational: this.operational,
      capacity: this.capacity,
      demand: this.demand,
      contamination: this.contamination
    };
  }

  serialize() {
    return this.snapshot();
  }

  hydrate(value = {}) {
    Object.assign(this, value);
  }
}
