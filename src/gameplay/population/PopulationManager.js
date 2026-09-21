import { Household } from "./Household.js";

export class PopulationManager {
  constructor({ initialPopulation = 0, eventBus }) {
    this.eventBus = eventBus;
    this.initialPopulation = initialPopulation;
    this.households = [];
    this.homeless = 0;
    this.evacuated = 0;
  }

  seed(houses = []) {
    this.households = [];
    let remaining = this.initialPopulation;
    let index = 0;
    while (remaining > 0 && houses.length) {
      const home = houses[index % houses.length];
      const members = Math.min(5, remaining);
      this.households.push(new Household({
        id: "hh-" + (index + 1),
        members,
        homeBuildingId: home.id,
        riskTolerance: 0.25 + (index % 7) * 0.1
      }));
      remaining -= members;
      index++;
    }
    return this.households;
  }

  get population() {
    return this.households.reduce((sum, household) => sum + household.members, 0);
  }

  get ratio() {
    return this.initialPopulation ? this.population / this.initialPopulation : 1;
  }

  buildingDestroyed(buildingId) {
    let count = 0;
    for (const household of this.households) {
      if (household.homeBuildingId === buildingId && !household.evacuated) count += household.members;
    }
    this.homeless += count;
    if (count) this.eventBus?.emit("population:homeless", { buildingId, count });
    return count;
  }

  serialize() {
    return {
      initialPopulation: this.initialPopulation,
      households: this.households,
      homeless: this.homeless,
      evacuated: this.evacuated
    };
  }

  hydrate(value = {}) {
    this.initialPopulation = Number(value.initialPopulation || this.initialPopulation);
    this.households = (value.households || []).map((item) => new Household(item));
    this.homeless = Number(value.homeless || 0);
    this.evacuated = Number(value.evacuated || 0);
  }
}
