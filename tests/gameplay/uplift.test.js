import test from "node:test";
import assert from "node:assert/strict";
import { UpliftSolver } from "../../src/gameplay/structural/UpliftSolver.js";

test("resistência vertical de estacas e âncoras reduz risco de uplift", () => {
  const weak = UpliftSolver.solve({ weight: 1000, anchorVertical: 0, pileVertical: 0, verticalUplift: 1200 });
  const strong = UpliftSolver.solve({ weight: 1000, anchorVertical: 500, pileVertical: 500, verticalUplift: 1200 });
  assert.ok(strong.factor > weak.factor);
  assert.ok(strong.factor > 1.5);
});
