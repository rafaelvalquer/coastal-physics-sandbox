export class WeatherState {
  constructor(values = {}) {
    Object.assign(this, {
      windSpeed: 6,
      windDirection: 90,
      rainfall: 0,
      tideOffset: 0,
      pressure: 1013,
      stormIntensity: 0,
      ...values
    });
  }

  interpolate(target, alpha) {
    const t = Math.max(0, Math.min(1, alpha));
    for (const key of ["windSpeed", "windDirection", "rainfall", "tideOffset", "pressure", "stormIntensity"]) {
      this[key] += ((target[key] ?? this[key]) - this[key]) * t;
    }
    return this;
  }

  clone() {
    return new WeatherState({ ...this });
  }
}
