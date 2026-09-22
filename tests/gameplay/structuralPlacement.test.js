import test from "node:test";
import assert from "node:assert/strict";
import { StructuralGrid } from "../../src/gameplay/structural/StructuralGrid.js";
import { StructuralPlacementValidator } from "../../src/gameplay/construction/StructuralPlacementValidator.js";

function terrain() {
  return {
    rows: 90,
    cellSize: 8,
    moisture: new Float32Array(2000),
    worldToCell: (x, y) => ({ x: Math.max(0, Math.floor(x / 8)), y: Math.max(0, Math.floor(y / 8)) }),
    columnTopWorldYAt: () => 480,
    index: (x, y) => y * 20 + x,
    getMaterial: () => ({ name: "Areia" })
  };
}

test("bloco base é encaixado em grade estrutural de 0,5 m sobre terreno", () => {
  const grid = new StructuralGrid();
  const validator = new StructuralPlacementValidator({
    grid,
    terrain: terrain(),
    buildings: { near: () => [] },
    inventory: { canPlan: () => ({ ok: true }) }
  });
  const result = validator.validate("CONCRETE_BLOCK", { x: 600, y: 480 });
  assert.equal(result.valid, true);
  assert.equal(result.x % 24, 12);
});

test("bloco suspenso sem apoio é rejeitado", () => {
  const grid = new StructuralGrid();
  const validator = new StructuralPlacementValidator({
    grid,
    terrain: terrain(),
    buildings: { near: () => [] },
    inventory: { canPlan: () => ({ ok: true }) }
  });
  const result = validator.validate("CONCRETE_BLOCK", { x: 600, y: 300 });
  assert.equal(result.valid, false);
  assert.match(result.reason, /sem apoio/i);
});
