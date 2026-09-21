import test from "node:test";
import assert from "node:assert/strict";
import { TerrainGrid } from "../../src/engine/world/TerrainGrid.js";
import { AtmosphereSystem } from "../../src/engine/physics/AtmosphereSystem.js";
import { WaterSolver } from "../../src/engine/physics/WaterSolver.js";
import { CoastalConstruction } from "../../src/gameplay/construction/CoastalConstruction.js";
import { PhysicsConstructionAdapter } from "../../src/gameplay/construction/PhysicsConstructionAdapter.js";

test("quebra-mar altera a batimetria que alimenta o solver, sem bônus artificial de dano", () => {
  const terrain = new TerrainGrid();
  const atmosphere = new AtmosphereSystem();
  const water = new WaterSolver(terrain, atmosphere, null);
  const engine = { terrain, water };
  const adapter = new PhysicsConstructionAdapter(engine);

  const construction = new CoastalConstruction({
    id: "bw-test",
    type: "BREAKWATER",
    x: 260,
    y: 430,
    length: 8
  });

  const index = Math.max(0, Math.min(water.n - 1, Math.floor(construction.x / water.dx)));
  const before = water.bed[index];
  adapter.apply(construction);
  const after = water.bed[index];

  assert.ok(after >= before);
  assert.ok(adapter.snapshots.get(construction.id).length > 0);
});
