export class CampaignManager {
  constructor() {
    this.scenarios = [
      "porto-esperanca",
      "baia-das-dunas",
      "costa-industrial",
      "delta",
      "cidade-portuaria"
    ];
    this.unlocked = new Set(["porto-esperanca"]);
    this.completed = new Set();
  }

  complete(id) {
    this.completed.add(id);
    const index = this.scenarios.indexOf(id);
    if (index >= 0 && this.scenarios[index + 1]) this.unlocked.add(this.scenarios[index + 1]);
  }

  serialize() {
    return {
      unlocked: [...this.unlocked],
      completed: [...this.completed]
    };
  }

  hydrate(value = {}) {
    this.unlocked = new Set(value.unlocked || ["porto-esperanca"]);
    this.completed = new Set(value.completed || []);
  }
}
