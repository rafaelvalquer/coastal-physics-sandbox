export class UpliftSolver {
  static solve(forces) {
    const resistance = forces.weight + forces.anchorVertical + forces.pileVertical;
    const demand = Math.max(1, forces.verticalUplift);
    const factor = resistance / demand;
    return {
      factor,
      resistance,
      demand,
      state: factor >= 1.5 ? "SAFE" : factor >= 1.2 ? "WARNING" : factor >= 1 ? "CRITICAL" : "FAILING"
    };
  }
}
