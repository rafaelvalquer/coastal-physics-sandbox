export class CenterOfMassSolver {
  static solve(blocks, grid, extraMasses = []) {
    const entries = [
      ...blocks.map((block) => ({
        mass: block.mass * Math.max(0.05, block.progress ?? 1),
        position: block.worldCenter(grid)
      })),
      ...extraMasses
    ].filter((entry) => entry.mass > 0);

    const totalMass = entries.reduce((sum, entry) => sum + entry.mass, 0);
    if (!totalMass) return { x: 0, y: 0, totalMass: 0 };

    return {
      x: entries.reduce((sum, entry) => sum + entry.mass * entry.position.x, 0) / totalMass,
      y: entries.reduce((sum, entry) => sum + entry.mass * entry.position.y, 0) / totalMass,
      totalMass
    };
  }
}
