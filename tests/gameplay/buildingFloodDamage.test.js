import test from "node:test";
import assert from "node:assert/strict";
import { BuildingManager } from "../../src/gameplay/buildings/BuildingManager.js";
import { BuildingDamageSystem } from "../../src/gameplay/buildings/BuildingDamageSystem.js";

test("inundação profunda causa dano acumulativo", () => {
  const manager = new BuildingManager();
  const building = manager.add({ id: "house", type: "HOUSE", x: 0, y: 100 });
  const system = new BuildingDamageSystem({
    terrain: {},
    water: { n: 1, dx: 4, h: new Float32Array([96]), velocityAtIndex: () => 0 },
    atmosphere: { wind: 0 },
    buildingManager: manager
  });
  system.update(1);
  assert.ok(building.integrity < building.maxIntegrity);
});
