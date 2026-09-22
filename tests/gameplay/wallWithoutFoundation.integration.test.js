import test from "node:test";
import assert from "node:assert/strict";
import { SlidingSolver } from "../../src/gameplay/structural/SlidingSolver.js";
import { OverturningSolver } from "../../src/gameplay/structural/OverturningSolver.js";

test("muro alto e fino sem fundação fica crítico sob a ressaca de validação", () => {
  const assembly = { bounds: { minX: 100, maxX: 124 }, centerOfMass: { x: 112 }, heightMeters: 3 };
  const sliding = SlidingSolver.solve({ frictionResistance: 7500, anchorHorizontal: 0, pileHorizontal: 0, horizontalForce: 13000 });
  const overturning = OverturningSolver.solve(assembly, {
    velocity: 1, weight: 20000, buoyancy: 4000, anchorMoment: 0, pileMoment: 0, waveMoment: 18000
  });
  assert.ok(sliding.factor < 1);
  assert.ok(overturning.factor < 1.5);
});
