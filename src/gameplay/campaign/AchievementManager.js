export class AchievementManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.unlocked = new Set();
    this.bind();
  }

  bind() {
    this.eventBus?.on("construction:placed", () => this.unlock("FIRST_DEFENSE"));
    this.eventBus?.on("storm:ended", () => this.unlock("STORM_SURVIVOR"));
    this.eventBus?.on("scenario:won", ({ scenarioId }) => this.unlock("MASTER_" + scenarioId.toUpperCase().replaceAll("-", "_")));
  }

  unlock(id) {
    if (this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    this.eventBus?.emit("achievement:unlocked", { id });
    return true;
  }

  serialize() {
    return { unlocked: [...this.unlocked] };
  }

  hydrate(value = {}) {
    this.unlocked = new Set(value.unlocked || []);
  }
}
