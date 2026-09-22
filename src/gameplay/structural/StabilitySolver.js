import { StructuralForces } from "./StructuralForces.js";
import { SlidingSolver } from "./SlidingSolver.js";
import { OverturningSolver } from "./OverturningSolver.js";
import { UpliftSolver } from "./UpliftSolver.js";
import { StabilityResult } from "./StabilityResult.js";

export class StabilitySolver {
  constructor({ water, foundation }) {
    this.water = water;
    this.foundation = foundation;
  }

  solve(assembly) {
    const forces = StructuralForces.calculate(assembly, {
      water: this.water,
      foundation: this.foundation
    });
    const result = new StabilityResult({
      forces,
      sliding: SlidingSolver.solve(forces),
      overturning: OverturningSolver.solve(assembly, forces),
      uplift: UpliftSolver.solve(forces),
      foundation: this.foundation.solveBearing(assembly, forces)
    });
    assembly.stability = result.serialize();
    return result;
  }
}
