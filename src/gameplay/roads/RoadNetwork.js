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

  heuristic(a, b) {
    const na = this.nodes.get(a);
    const nb = this.nodes.get(b);
    if (!na || !nb) return 0;
    return Math.hypot(na.x - nb.x, na.y - nb.y) / 50;
  }

  route(start, end) {
    if (!this.nodes.has(start) || !this.nodes.has(end)) return [];
    if (start === end) return [start];

    const gScore = new Map([[start, 0]]);
    const fScore = new Map([[start, this.heuristic(start, end)]]);
    const previous = new Map();
    const open = new Set([start]);

    while (open.size) {
      let current = null;
      let best = Infinity;
      for (const id of open) {
        const score = fScore.get(id) ?? Infinity;
        if (score < best) {
          best = score;
          current = id;
        }
      }

      if (current === end) {
        const path = [end];
        while (path[0] !== start) path.unshift(previous.get(path[0]));
        return path;
      }

      open.delete(current);
      for (const edge of this.edges.values()) {
        const next = edge.a === current ? edge.b : edge.b === current ? edge.a : null;
        const speed = this.effectiveSpeed(edge);
        if (!next || speed <= 0) continue;

        const candidate = (gScore.get(current) ?? Infinity) + edge.length / speed;
        if (candidate < (gScore.get(next) ?? Infinity)) {
          previous.set(next, current);
          gScore.set(next, candidate);
          fScore.set(next, candidate + this.heuristic(next, end));
          open.add(next);
        }
      }
    }

    return [];
  }

  pathEdges(path = []) {
    const result = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edge = [...this.edges.values()].find((item) =>
        (item.a === path[i] && item.b === path[i + 1]) ||
        (item.b === path[i] && item.a === path[i + 1])
      );
      if (edge) result.push(edge);
    }
    return result;
  }

  updateFlooding(water) {
    if (!water) return;
    for (const edge of this.edges.values()) {
      const a = this.nodes.get(edge.a);
      const b = this.nodes.get(edge.b);
      if (!a || !b) continue;
      const midpointX = (a.x + b.x) / 2;
      const index = Math.max(0, Math.min(water.n - 1, Math.floor(midpointX / water.dx)));
      edge.floodDepth = Math.max(0, (water.h[index] || 0) / 48);
    }
  }
}
