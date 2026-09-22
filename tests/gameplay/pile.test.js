import test from "node:test";
import assert from "node:assert/strict";
import { SoilBearingSolver } from "../../src/gameplay/foundation/SoilBearingSolver.js";

test("estaca profunda em rocha tem maior capacidade que estaca rasa em areia saturada", () => {
  const shallow = SoilBearingSolver.pileCapacity("Areia", 2.5, 0.25, 0.9);
  const deep = SoilBearingSolver.pileCapacity("Rocha", 5, 0.35, 0.1);
  assert.ok(deep.axial > shallow.axial);
  assert.ok(deep.lateral > shallow.lateral);
});
