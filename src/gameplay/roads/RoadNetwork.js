export class RoadNetwork {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(id, x, y) {
    this.nodes.set(id, { id, x, y });
    return this.nodes.get(id);
  }

  addEdge(id, a, b, {
    length = 1,
    capacity = 100,
    speedLimit = 50,
    integrity = 1,
    floodDepth = 0
  } = {}) {
    const edge = { id, a, b, length, capacity, speedLimit, integrity, floodDepth, volume: 0 };
    this.edges.set(id, edge);
    return edge;
  }

  effectiveSpeed(edge) {
    if (!edge || edge.integrity <= 0 || edge.floodDepth > 0.5) return 0;
    const floodFactor = edge.floodDepth < 0.15 ? 1 : edge.floodDepth < 0.30 ? 0.6 : 0.2;
    const congestionFactor = Math.max(
      0.1,
      1 - Math.max(0, edge.volume - edge.capacity) / Math.max(1, edge.capacity)
    );
    return edge.speedLimit * floodFactor * congestionFactor;
  }

  route(start, end) {
    if (!this.nodes.has(start) || !this.nodes.has(end)) return [];
    if (start === end) return [start];

    const distance = new Map([[start, 0]]);
    const previous = new Map();
    const open = new Set([start]);

    while (open.size) {
      let current = null;
      let best = Infinity;
      for (const id of open) {
        const score = distance.get(id) ?? Infinity;
        if (score < best) {
          best = score;
          current = id;
        }
      }
      open.delete(current);
      if (current === end) break;

      for (const edge of this.edges.values()) {
        const next = edge.a === current ? edge.b : edge.b === current ? edge.a : null;
        const speed = this.effectiveSpeed(edge);
        if (!next || speed <= 0) continue;
        const candidate = best + edge.length / speed;
        if (candidate < (distance.get(next) ?? Infinity)) {
          distance.set(next, candidate);
          previous.set(next, current);
          open.add(next);
        }
      }
    }

    if (!previous.has(end)) return [];
    const path = [end];
    while (path[0] !== start) path.unshift(previous.get(path[0]));
    return path;
  }
}
