import test from "node:test";
import assert from "node:assert/strict";
import { SlidingSolver } from "../../src/gameplay/structural/SlidingSolver.js";
import { OverturningSolver } from "../../src/gameplay/structural/OverturningSolver.js";

test("sapata larga melhora deslizamento e tombamento na mesma ressaca", () => {
  const narrow = { bounds: { minX: 100, maxX: 124 }, centerOfMass: { x: 112 }, heightMeters: 3 };
  const wide = { bounds: { minX: 76, maxX: 148 }, centerOfMass: { x: 112 }, heightMeters: 3 };
  const baseForces = { velocity: 1, weight: 20000, buoyancy: 4000, anchorMoment: 0, pileMoment: 0, waveMoment: 18000 };
  const narrowTurn = OverturningSolver.solve(narrow, baseForces);
  const wideTurn = OverturningSolver.solve(wide, baseForces);
  const narrowSlide = SlidingSolver.solve({ frictionResistance: 7500, anchorHorizontal: 0, pileHorizontal: 0, horizontalForce: 13000 });
  const wideSlide = SlidingSolver.solve({ frictionResistance: 12500, anchorHorizontal: 0, pileHorizontal: 0, horizontalForce: 13000 });
  assert.ok(wideTurn.factor > narrowTurn.factor);
  assert.ok(wideSlide.factor > narrowSlide.factor);
});
