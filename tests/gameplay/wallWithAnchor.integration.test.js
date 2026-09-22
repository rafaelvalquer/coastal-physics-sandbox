import test from "node:test";
import assert from "node:assert/strict";
import { SlidingSolver } from "../../src/gameplay/structural/SlidingSolver.js";
import { OverturningSolver } from "../../src/gameplay/structural/OverturningSolver.js";

test("âncora completa defesa em camadas elevando estabilidade sem bônus artificial de dano", () => {
  const assembly = { bounds: { minX: 76, maxX: 148 }, centerOfMass: { x: 112 }, heightMeters: 3 };
  const pileSlide = SlidingSolver.solve({ frictionResistance: 12500, anchorHorizontal: 0, pileHorizontal: 6500, horizontalForce: 13000 });
  const anchorSlide = SlidingSolver.solve({ frictionResistance: 12500, anchorHorizontal: 5000, pileHorizontal: 6500, horizontalForce: 13000 });
  const pileTurn = OverturningSolver.solve(assembly, {
    velocity: 1, weight: 20000, buoyancy: 4000, anchorMoment: 0, pileMoment: 9000, waveMoment: 18000
  });
  const anchorTurn = OverturningSolver.solve(assembly, {
    velocity: 1, weight: 20000, buoyancy: 4000, anchorMoment: 12000, pileMoment: 9000, waveMoment: 18000
  });
  assert.ok(anchorSlide.factor > pileSlide.factor);
  assert.ok(anchorTurn.factor > pileTurn.factor);
  assert.ok(anchorTurn.factor >= 1.5);
});
