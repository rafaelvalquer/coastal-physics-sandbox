export class EvacuationManager {
  constructor({ population, roads, eventBus }) {
    Object.assign(this, { population, roads, eventBus });
    this.order = "NONE";
  }

  issue(type = "VOLUNTARY") {
    this.order = type;
    let count = 0;
    for (const household of this.population.households) {
      if (!household.evacuated) {
        household.evacuated = true;
        count += household.members;
      }
    }
    this.population.evacuated = count;
    this.eventBus?.emit("population:evacuated", { type, count });
    return count;
  }

  clear() {
    this.order = "NONE";
    for (const household of this.population.households) household.evacuated = false;
    this.population.evacuated = 0;
  }
}
