import test from "node:test";
import assert from "node:assert/strict";
import { StructuralGrid } from "../../src/gameplay/structural/StructuralGrid.js";
import { StructuralFoundationSystem } from "../../src/gameplay/foundation/StructuralFoundationSystem.js";

test("fundação perde integridade quando solo está destruído e saturado", () => {
  const grid = new StructuralGrid();
  const terrain = {
    rows: 100, cellSize: 8,
    moisture: new Float32Array(1000).fill(1),
    integrity: new Float32Array(1000).fill(0.1),
    worldToCell: () => ({ x: 1, y: 1 }),
    columnTopCell: () => 1,
    columnTopWorldYAt: () => 400,
    index: () => 1,
    getMaterial: () => ({ name: "Areia" })
  };
  const system = new StructuralFoundationSystem({ terrain, water: {}, grid });
  const element = system.create({ type: "SHALLOW_PILE", x: 500, y: 400, assemblyId: "a" });
  const before = element.integrity;
  system.update(10);
  assert.ok(element.integrity < before);
});
