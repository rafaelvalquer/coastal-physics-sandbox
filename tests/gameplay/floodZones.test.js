import test from "node:test";
import assert from "node:assert/strict";
import { FloodZoneManager } from "../../src/gameplay/flood/FloodZoneManager.js";

test("FloodZoneManager classifica profundidade e população afetada", () => {
  const h = new Float32Array(10);
  h[1] = 28;
  h[2] = 24;
  const water = {
    n: 10,
    dx: 4,
    h,
    velocityAtIndex: () => 24
  };
  const buildings = {
    list: () => [
      { x: 6, occupants: 5 },
      { x: 8, occupants: 4 }
    ]
  };

  const manager = new FloodZoneManager({
    zones: [{ id: "a", name: "Zona A", minX: 0, maxX: 16 }],
    water,
    buildings
  });

  const [zone] = manager.update(1);
  assert.ok(zone.waterDepth >= 0.5);
  assert.equal(zone.level, "BUILDINGS");
  assert.equal(zone.floodedBuildings, 2);
  assert.equal(zone.populationAffected, 9);
});
