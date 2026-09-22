import { StructuralAssembly } from "./StructuralAssembly.js";

export class AssemblyBuilder {
  constructor({ grid, graph }) {
    this.grid = grid;
    this.graph = graph;
  }

  build(blocks = [], existing = []) {
    const byId = new Map(blocks.map((block) => [block.id, block]));
    const visited = new Set();
    const usedPrevious = new Set();
    const assemblies = [];

    for (const block of blocks) {
      if (visited.has(block.id) || block.integrity <= 0) continue;
      const queue = [block.id];
      const component = [];
      visited.add(block.id);

      while (queue.length) {
        const id = queue.shift();
        const current = byId.get(id);
        if (!current) continue;
        component.push(current);
        for (const neighbor of this.graph.neighbors(id)) {
          if (!visited.has(neighbor) && byId.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      const previous = existing.find((assembly) =>
        !usedPrevious.has(assembly.id) &&
        assembly.blocks.some((item) => component.some((candidate) => candidate.id === item.id))
      );
      if (previous) usedPrevious.add(previous.id);
      const assembly = previous || new StructuralAssembly();
      assembly.blocks = component;
      for (const item of component) item.assemblyId = assembly.id;
      assembly.recalculate(this.grid);
      assemblies.push(assembly);
    }

    return assemblies;
  }
}
