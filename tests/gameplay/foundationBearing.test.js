import test from "node:test";
import assert from "node:assert/strict";
import { SoilBearingSolver } from "../../src/gameplay/foundation/SoilBearingSolver.js";
import { FoundationBearingSolver } from "../../src/gameplay/foundation/FoundationBearingSolver.js";

test("rocha suporta mais carga que areia saturada", () => {
  const rock = SoilBearingSolver.materialCapacity("Rocha", 1);
  const sand = SoilBearingSolver.materialCapacity("Areia", 0.9);
  assert.ok(rock > sand);
});

test("capacidade de estacas entra no fator de fundação", () => {
  const noPile = FoundationBearingSolver.solve({ bearingCapacity: 1000, pileVertical: 0, weight: 2000, buoyancy: 0 });
  const withPile = FoundationBearingSolver.solve({ bearingCapacity: 1000, pileVertical: 4000, weight: 2000, buoyancy: 0 });
  assert.ok(withPile.factor > noPile.factor);
});
