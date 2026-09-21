export class PowerNetwork {
  constructor() {
    this.nodes = new Map();
    this.links = [];
  }

  addNode(id, {
    generation = 0,
    demand = 0,
    operational = true,
    backupGenerator = false
  } = {}) {
    const node = { id, generation, demand, operational, backupGenerator, powered: false };
    this.nodes.set(id, node);
    return node;
  }

  connect(a, b) {
    this.links.push([a, b]);
  }

  update() {
    const active = [...this.nodes.values()].filter((node) => node.operational);
    const generation = active.reduce((sum, node) => sum + node.generation, 0);
    const demand = active.reduce((sum, node) => sum + node.demand, 0);
    const available = generation >= demand * 0.8;
    for (const node of this.nodes.values()) {
      node.powered = node.operational && (available || node.backupGenerator);
    }
    return { generation, demand, available };
  }

  serialize() {
    return { nodes: [...this.nodes.entries()], links: this.links };
  }

  hydrate(value = {}) {
    this.nodes = new Map(value.nodes || []);
    this.links = value.links || [];
  }
}
