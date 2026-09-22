import test from "node:test";
import assert from "node:assert/strict";
import { StructuralGrid } from "../../src/gameplay/structural/StructuralGrid.js";
import { StructuralBlock } from "../../src/gameplay/structural/StructuralBlock.js";
import { StructuralAssembly } from "../../src/gameplay/structural/StructuralAssembly.js";

test("assembly calcula altura, base e massa a partir de blocos verticais", () => {
  const grid = new StructuralGrid();
  const base = new StructuralBlock({ type: "FOUNDATION_BLOCK", gridX: 10, gridY: 20 });
  const b1 = new StructuralBlock({ type: "CONCRETE_BLOCK", gridX: 10, gridY: 19 });
  const b2 = new StructuralBlock({ type: "CONCRETE_BLOCK", gridX: 10, gridY: 18 });
  const assembly = new StructuralAssembly({ blocks: [base, b1, b2] });
  assembly.recalculate(grid);
  assert.ok(assembly.heightMeters >= 1.5);
  assert.ok(assembly.baseWidthMeters >= 1);
  assert.ok(assembly.totalMass > 0);
});
