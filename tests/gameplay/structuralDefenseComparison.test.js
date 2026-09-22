import test from "node:test";
import assert from "node:assert/strict";
import { SlidingSolver } from "../../src/gameplay/structural/SlidingSolver.js";
import { OverturningSolver } from "../../src/gameplay/structural/OverturningSolver.js";

test("mesma onda: sapata, estacas e âncora melhoram progressivamente a estabilidade", () => {
  const narrow = { bounds: { minX: 100, maxX: 124 }, centerOfMass: { x: 112 }, heightMeters: 3 };
  const wide = { bounds: { minX: 80, maxX: 144 }, centerOfMass: { x: 112 }, heightMeters: 3 };
  const wave = { velocity: 1, weight: 20000, buoyancy: 4000, waveMoment: 18000, horizontalForce: 13000 };

  const A = {
    slide: SlidingSolver.solve({ ...wave, frictionResistance: 7000, anchorHorizontal: 0, pileHorizontal: 0 }),
    turn: OverturningSolver.solve(narrow, { ...wave, anchorMoment: 0, pileMoment: 0 })
  };
  const B = {
    slide: SlidingSolver.solve({ ...wave, frictionResistance: 12000, anchorHorizontal: 0, pileHorizontal: 0 }),
    turn: OverturningSolver.solve(wide, { ...wave, anchorMoment: 0, pileMoment: 0 })
  };
  const C = {
    slide: SlidingSolver.solve({ ...wave, frictionResistance: 12000, anchorHorizontal: 0, pileHorizontal: 6000 }),
    turn: OverturningSolver.solve(wide, { ...wave, anchorMoment: 0, pileMoment: 9000 })
  };
  const D = {
    slide: SlidingSolver.solve({ ...wave, frictionResistance: 12000, anchorHorizontal: 5000, pileHorizontal: 6000 }),
    turn: OverturningSolver.solve(wide, { ...wave, anchorMoment: 12000, pileMoment: 9000 })
  };

  assert.ok(B.turn.factor > A.turn.factor);
  assert.ok(C.slide.factor > B.slide.factor);
  assert.ok(D.turn.factor > C.turn.factor);
});
