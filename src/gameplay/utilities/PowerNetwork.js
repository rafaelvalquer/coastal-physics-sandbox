export class PowerNetwork {
  constructor() {
    this.nodes = new Map();
    this.links = [];
  }

  addNode(id, {
    generation = 0,
    demand = 0,
    operational = true,
    backupGenerator = false,
    priority = 0
  } = {}) {
    const node = {
      id,
      generation,
      demand,
      operational,
      backupGenerator,
      priority,
      powered: false
    };
    this.nodes.set(id, node);
    return node;
  }

  connect(a, b) {
    this.links.push([a, b]);
  }

  setPriority(id, priority = 1) {
    const node = this.nodes.get(id);
    if (!node) return false;
    node.priority = Math.max(0, Number(priority) || 0);
    return true;
  }

  update() {
    const active = [...this.nodes.values()].filter((node) => node.operational);
    const generation = active.reduce((sum, node) => sum + node.generation, 0);
    const demand = active.reduce((sum, node) => sum + node.demand, 0);
    let remaining = generation;

    const consumers = active
      .filter((node) => node.demand > 0)
      .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

    for (const node of this.nodes.values()) {
      node.powered = node.operational && node.demand <= 0;
    }

    for (const node of consumers) {
      if (node.backupGenerator) {
        node.powered = true;
        continue;
      }
      if (remaining >= node.demand) {
        node.powered = true;
        remaining -= node.demand;
      } else {
        node.powered = false;
      }
    }

    const poweredDemand = consumers
      .filter((node) => node.powered)
      .reduce((sum, node) => sum + node.demand, 0);
    const available = demand === 0 || poweredDemand >= demand * 0.8;

    return {
      generation,
      demand,
      poweredDemand,
      available,
      nodes: Object.fromEntries(
        [...this.nodes.entries()].map(([id, node]) => [id, {
          powered: node.powered,
          priority: node.priority,
          operational: node.operational
        }])
      )
    };
  }

  serialize() {
    return { nodes: [...this.nodes.entries()], links: this.links };
  }

  hydrate(value = {}) {
    this.nodes = new Map(value.nodes || []);
    this.links = value.links || [];
  }
}
