import test from "node:test";
import assert from "node:assert/strict";
import { OverturningSolver } from "../../src/gameplay/structural/OverturningSolver.js";

test("momento de âncora eleva fator de segurança ao tombamento", () => {
  const assembly = {
    bounds: { minX: 100, maxX: 148 },
    centerOfMass: { x: 124 },
    heightMeters: 3
  };
  const withoutAnchor = OverturningSolver.solve(assembly, {
    velocity: 1,
    weight: 18000,
    buoyancy: 3000,
    anchorMoment: 0,
    pileMoment: 0,
    waveMoment: 18000
  });
  const anchored = OverturningSolver.solve(assembly, {
    velocity: 1,
    weight: 18000,
    buoyancy: 3000,
    anchorMoment: 14000,
    pileMoment: 0,
    waveMoment: 18000
  });
  assert.ok(anchored.factor > withoutAnchor.factor);
});
