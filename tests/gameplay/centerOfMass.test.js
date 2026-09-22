import test from "node:test";
import assert from "node:assert/strict";
import { StructuralGrid } from "../../src/gameplay/structural/StructuralGrid.js";
import { StructuralBlock } from "../../src/gameplay/structural/StructuralBlock.js";
import { CenterOfMassSolver } from "../../src/gameplay/structural/CenterOfMassSolver.js";

test("centro de massa desloca para o bloco mais pesado", () => {
  const grid = new StructuralGrid();
  const left = new StructuralBlock({ type: "CONCRETE_BLOCK", gridX: 10, gridY: 10 });
  const right = new StructuralBlock({ type: "FOUNDATION_BLOCK", gridX: 12, gridY: 10 });
  const result = CenterOfMassSolver.solve([left, right], grid);
  assert.ok(result.x > left.worldCenter(grid).x);
  assert.ok(result.totalMass > left.mass);
});
