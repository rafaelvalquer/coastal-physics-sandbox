import test from "node:test";
import assert from "node:assert/strict";
import { Building } from "../../src/gameplay/buildings/Building.js";
import { FoundationSystem } from "../../src/gameplay/buildings/FoundationSystem.js";

function terrainWithTop(topRow) {
  const cols = 40;
  const rows = 100;
  return {
    cellSize: 8,
    cols,
    rows,
    moisture: new Float32Array(cols * rows),
    integrity: new Float32Array(cols * rows).fill(1),
    worldToCell(x) { return { x: Math.max(0, Math.min(cols - 1, Math.floor(x / 8))), y: 10 }; },
    columnTopCell() { return topRow.value; },
    index(x, y) { return y * cols + x; }
  };
}

test("fundação perde suporte quando erosão rebaixa o terreno além da profundidade útil", () => {
  const topRow = { value: 10 };
  const terrain = terrainWithTop(topRow);
  const building = new Building({ id: "house", type: "HOUSE", x: 80, y: 80 });
  building.foundation.depth = 1;

  const system = new FoundationSystem({ terrain });
  assert.equal(system.sample(building).supportRatio, 1);

  topRow.value = 13;
  assert.equal(system.sample(building).supportRatio, 0);
});
