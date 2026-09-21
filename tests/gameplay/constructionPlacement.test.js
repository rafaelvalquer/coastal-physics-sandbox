import test from "node:test";
import assert from "node:assert/strict";
import { Budget } from "../../src/gameplay/economy/Budget.js";
import { PlacementValidator } from "../../src/gameplay/construction/PlacementValidator.js";

const terrain = {
  rows: 20,
  moisture: new Float32Array(20),
  worldToCell: () => ({ x: 0, y: 0 }),
  columnTopCell: () => 10,
  index: () => 10,
  cellSize: 8
};

test("PlacementValidator aplica orçamento e restrição terra/água", () => {
  const budget = new Budget(100000);
  const buildings = { near: () => [] };
  const landWater = { n: 1, dx: 4, h: new Float32Array([0]) };
  const validator = new PlacementValidator({
    terrain,
    water: landWater,
    budget,
    buildingManager: buildings
  });

  assert.equal(validator.validate("CONCRETE_WALL", { x: 0, y: 80 }, 10).valid, true);
  assert.equal(validator.validate("BREAKWATER", { x: 0, y: 80 }, 10).valid, false);

  const poor = new PlacementValidator({
    terrain,
    water: landWater,
    budget: new Budget(1),
    buildingManager: buildings
  });
  assert.equal(poor.validate("CONCRETE_WALL", { x: 0, y: 80 }, 10).reason, "Orçamento insuficiente");
});
