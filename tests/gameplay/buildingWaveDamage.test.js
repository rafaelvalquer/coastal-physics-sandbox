import test from "node:test";
import assert from "node:assert/strict";
import { BuildingManager } from "../../src/gameplay/buildings/BuildingManager.js";
import { BuildingDamageSystem } from "../../src/gameplay/buildings/BuildingDamageSystem.js";

test("pressão dinâmica de onda causa dano quando há profundidade e velocidade", () => {
  const manager = new BuildingManager();
  const building = manager.add({ id: "house", type: "HOUSE", x: 0, y: 100 });
  const system = new BuildingDamageSystem({
    terrain: {},
    water: { n: 1, dx: 4, h: new Float32Array([48]), velocityAtIndex: () => 96 },
    atmosphere: { wind: 0 },
    buildingManager: manager
  });
  system.update(2);
  assert.ok(building.integrity < building.maxIntegrity);
  assert.ok(building.damageByCause.ENVIRONMENT > 0);
});
