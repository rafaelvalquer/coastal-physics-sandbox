export class FailureManager {
  evaluate({ populationRatio, buildings }) {
    if (buildings?.["city-hall"]?.integrity <= 0) {
      return { failed: true, reason: "Prefeitura destruída" };
    }
    if (populationRatio < 0.3) {
      return { failed: true, reason: "População abaixo de 30%" };
    }
    return { failed: false, reason: null };
  }
}
