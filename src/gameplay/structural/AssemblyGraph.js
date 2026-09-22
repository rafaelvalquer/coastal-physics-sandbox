import { BlockConnection } from "./BlockConnection.js";

export class AssemblyGraph {
  constructor() {
    this.connections = new Map();
  }

  connect(a, b, type = "CONTACT") {
    const ids = [a, b].sort();
    const id = ids[0] + ":" + ids[1];
    if (!this.connections.has(id)) {
      this.connections.set(id, new BlockConnection({ id, a: ids[0], b: ids[1], type }));
    }
    return this.connections.get(id);
  }

  removeForBlock(blockId) {
    for (const [id, connection] of this.connections) {
      if (connection.a === blockId || connection.b === blockId) this.connections.delete(id);
    }
  }

  neighbors(blockId) {
    const result = [];
    for (const connection of this.connections.values()) {
      if (connection.a === blockId) result.push(connection.b);
      else if (connection.b === blockId) result.push(connection.a);
    }
    return result;
  }

  serialize() {
    return [...this.connections.values()].map((item) => item.serialize());
  }

  hydrate(value = []) {
    this.connections.clear();
    for (const raw of value) {
      const connection = new BlockConnection(raw);
      this.connections.set(connection.id, connection);
    }
  }
}
