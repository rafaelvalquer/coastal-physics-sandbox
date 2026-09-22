import test from "node:test";
import assert from "node:assert/strict";
import { TerrainGrid } from "../../src/engine/world/TerrainGrid.js";
import { WORLD } from "../../src/engine/world/constants.js";

test("bairro inicial de Porto Esperança nasce acima do nível médio do mar", () => {
  const terrain = new TerrainGrid();
  const coastalHouseGround = terrain.columnTopWorldYAt(650);
  const hospitalGround = terrain.columnTopWorldYAt(850);

  assert.ok(coastalHouseGround < WORLD.seaLevelY);
  assert.ok(hospitalGround < WORLD.seaLevelY);
  assert.ok(hospitalGround < coastalHouseGround);
});
