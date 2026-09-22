import test from "node:test";
import assert from "node:assert/strict";
import { StructuralGrid } from "../../src/gameplay/structural/StructuralGrid.js";
import { StructuralBlock } from "../../src/gameplay/structural/StructuralBlock.js";

test("StructuralGrid usa módulos de 0,5 m / 24 px sem alterar TerrainGrid", () => {
  const grid = new StructuralGrid();
  assert.equal(grid.cellMeters, 0.5);
  assert.equal(grid.cellSize, 24);
  const p = grid.snapWorld(101, 203);
  assert.ok(Number.isInteger(p.gridX));
  assert.ok(Number.isInteger(p.gridY));
});

test("StructuralGrid impede sobreposição de blocos", () => {
  const grid = new StructuralGrid();
  const a = new StructuralBlock({ type: "CONCRETE_BLOCK", gridX: 10, gridY: 10 });
  const b = new StructuralBlock({ type: "CONCRETE_BLOCK", gridX: 10, gridY: 10 });
  assert.equal(grid.occupyBlock(a), true);
  assert.equal(grid.occupyBlock(b), false);
});
