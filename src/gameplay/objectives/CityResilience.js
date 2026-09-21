export class CityResilience {
  calculate({ infrastructure = 1, population = 1, power = 1, water = 1, economy = 1 }) {
    return Math.round(100 * (
      0.30 * infrastructure +
      0.25 * population +
      0.15 * power +
      0.15 * water +
      0.15 * economy
    ));
  }
}
