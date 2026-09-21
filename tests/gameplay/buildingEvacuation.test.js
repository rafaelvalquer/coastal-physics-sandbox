import test from "node:test";
import assert from "node:assert/strict";
import { EvacuationManager } from "../../src/gameplay/evacuation/EvacuationManager.js";

test("ordem por prédio seleciona apenas moradores daquele endereço", () => {
  const population = {
    evacuated: 0,
    households: [
      { id: "a", members: 4, homeBuildingId: "house-1", evacuated: false },
      { id: "b", members: 5, homeBuildingId: "house-2", evacuated: false },
      { id: "c", members: 3, homeBuildingId: "house-1", evacuated: false }
    ]
  };
  const roads = { edges: new Map() };
  const manager = new EvacuationManager({ population, roads });

  const requested = manager.issueBuilding("house-1");
  assert.equal(requested, 7);
  assert.deepEqual(manager.pending.map((item) => item.id), ["a", "c"]);
});
