export class TechnologyTree {
  constructor() {
    this.points = 0;
    this.unlocked = new Set(["RIPRAP", "CONCRETE_WALL", "DRAINAGE"]);
    this.nodes = {
      TETRAPODS: { cost: 3, requires: "RIPRAP" },
      BREAKWATER: { cost: 3 },
      BREAKWATER_ADV: { cost: 4, requires: "BREAKWATER" },
      PUMPS: { cost: 3, requires: "DRAINAGE" },
      RADAR: { cost: 2 },
      SENSORS: { cost: 2, requires: "RADAR" }
    };
  }

  grant(points = 1) {
    this.points += Math.max(0, Number(points) || 0);
  }

  unlock(id) {
    const node = this.nodes[id];
    if (!node || this.unlocked.has(id) || this.points < node.cost) return false;
    if (node.requires && !this.unlocked.has(node.requires)) return false;
    this.points -= node.cost;
    this.unlocked.add(id);
    return true;
  }

  serialize() {
    return { points: this.points, unlocked: [...this.unlocked] };
  }
}
