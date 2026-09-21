export class StormGenerator {
  constructor(random) {
    this.random = random;
    this.sequence = 1;
  }

  generate(startDate = new Date()) {
    const intensity = this.random.range(0.45, 1);
    return {
      id: "storm-" + this.sequence++,
      name: intensity > 0.8 ? "Tempestade severa" : "Ressaca costeira",
      startDate: new Date(startDate),
      approachDuration: this.random.range(8, 20),
      peakDuration: this.random.range(4, 12),
      decayDuration: this.random.range(10, 24),
      maxWindSpeed: this.random.range(45, 105) * intensity,
      rainfallRate: this.random.range(15, 95) * intensity,
      stormSurge: this.random.range(0.25, 1.4) * intensity,
      direction: this.random.range(60, 120),
      intensity
    };
  }
}
