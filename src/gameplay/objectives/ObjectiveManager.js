export class ObjectiveManager {
  constructor({ eventBus, scenario }) {
    this.eventBus = eventBus;
    this.scenario = scenario;
    this.completed = new Set();
    this.failed = new Set();
  }

  evaluate(snapshot) {
    const goals = this.scenario.goals || {};
    if (goals.surviveYears && snapshot.yearsSurvived >= goals.surviveYears) {
      this.complete("SURVIVE_YEARS");
    }
    if (
      goals.minPopulationRatio &&
      snapshot.populationRatio >= goals.minPopulationRatio &&
      snapshot.yearsSurvived >= goals.surviveYears
    ) {
      this.complete("MAINTAIN_POPULATION");
    }
    for (const id of goals.criticalBuildings || []) {
      if (snapshot.buildings?.[id]?.operational && snapshot.yearsSurvived >= goals.surviveYears) {
        this.complete("PROTECT_" + id.toUpperCase().replaceAll("-", "_"));
      }
    }
    return this.status();
  }

  complete(id) {
    if (this.completed.has(id)) return;
    this.completed.add(id);
    this.eventBus?.emit("objective:completed", { id });
  }

  fail(id) {
    if (this.failed.has(id)) return;
    this.failed.add(id);
    this.eventBus?.emit("objective:failed", { id });
  }

  status() {
    return { completed: [...this.completed], failed: [...this.failed] };
  }

  serialize() {
    return this.status();
  }

  hydrate(value = {}) {
    this.completed = new Set(value.completed || []);
    this.failed = new Set(value.failed || []);
  }
}
