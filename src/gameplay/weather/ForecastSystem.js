export class ForecastSystem {
  constructor(random) {
    this.random = random;
  }

  forecast(storm, horizonDays = 1) {
    if (!storm) return null;
    const error = Math.min(0.35, 0.04 + horizonDays * 0.04);
    const range = (value) => {
      const jitter = (this.random.next() - 0.5) * 0.4;
      const delta = Math.abs(value) * error;
      const center = value * (1 + jitter * error);
      return [Math.max(0, center - delta), center + delta];
    };
    return {
      horizonDays,
      wind: range(storm.maxWindSpeed),
      waves: range(storm.targetWaveHeight || (0.8 + storm.intensity * 3.3)),
      tide: range(storm.stormSurge),
      rain: range(storm.rainfallRate),
      confidence: horizonDays <= 1 ? "HIGH" : horizonDays <= 3 ? "MEDIUM" : "LOW"
    };
  }
}
