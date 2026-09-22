import test from "node:test";
import assert from "node:assert/strict";
import { OverturningSolver } from "../../src/gameplay/structural/OverturningSolver.js";

test("base larga e momento de âncora melhoram tombamento", () => {
  const assembly = {
    bounds: { minX: 100, maxX: 196 },
    centerOfMass: { x: 145 },
    heightMeters: 3
  };
  const weak = OverturningSolver.solve(assembly, { velocity: 1, weight: 1000, buoyancy: 100, anchorMoment: 0, pileMoment: 0, waveMoment: 5000 });
  const anchored = OverturningSolver.solve(assembly, { velocity: 1, weight: 1000, buoyancy: 100, anchorMoment: 5000, pileMoment: 2500, waveMoment: 5000 });
  assert.ok(anchored.factor > weak.factor);
});
