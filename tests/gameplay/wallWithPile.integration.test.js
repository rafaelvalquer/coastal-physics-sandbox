import test from "node:test";
import assert from "node:assert/strict";
import { SlidingSolver } from "../../src/gameplay/structural/SlidingSolver.js";
import { OverturningSolver } from "../../src/gameplay/structural/OverturningSolver.js";

test("estacas adicionam resistência lateral e momento ao muro com sapata", () => {
  const assembly = { bounds: { minX: 76, maxX: 148 }, centerOfMass: { x: 112 }, heightMeters: 3 };
  const footingSlide = SlidingSolver.solve({ frictionResistance: 12500, anchorHorizontal: 0, pileHorizontal: 0, horizontalForce: 13000 });
  const pileSlide = SlidingSolver.solve({ frictionResistance: 12500, anchorHorizontal: 0, pileHorizontal: 6500, horizontalForce: 13000 });
  const footingTurn = OverturningSolver.solve(assembly, {
    velocity: 1, weight: 20000, buoyancy: 4000, anchorMoment: 0, pileMoment: 0, waveMoment: 18000
  });
  const pileTurn = OverturningSolver.solve(assembly, {
    velocity: 1, weight: 20000, buoyancy: 4000, anchorMoment: 0, pileMoment: 9000, waveMoment: 18000
  });
  assert.ok(pileSlide.factor > footingSlide.factor);
  assert.ok(pileTurn.factor > footingTurn.factor);
});
