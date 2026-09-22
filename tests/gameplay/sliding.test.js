import test from "node:test";
import assert from "node:assert/strict";
import { SlidingSolver } from "../../src/gameplay/structural/SlidingSolver.js";

test("estacas e âncoras aumentam o fator de segurança contra deslizamento", () => {
  const base = SlidingSolver.solve({ frictionResistance: 100, anchorHorizontal: 0, pileHorizontal: 0, horizontalForce: 100 });
  const reinforced = SlidingSolver.solve({ frictionResistance: 100, anchorHorizontal: 60, pileHorizontal: 50, horizontalForce: 100 });
  assert.ok(reinforced.factor > base.factor);
  assert.equal(reinforced.state, "SAFE");
});
