export class SlidingSolver {
  static solve(forces) {
    const resistance =
      forces.frictionResistance +
      forces.anchorHorizontal +
      forces.pileHorizontal;
    const demand = Math.max(1, forces.horizontalForce);
    const factor = resistance / demand;
    return {
      factor,
      resistance,
      demand,
      state: factor >= 1.5 ? "SAFE" : factor >= 1.2 ? "WARNING" : factor >= 1 ? "CRITICAL" : "FAILING"
    };
  }
}
