import test from "node:test";
import assert from "node:assert/strict";
import { Budget } from "../../src/gameplay/economy/Budget.js";
import { MaintenanceSystem } from "../../src/gameplay/economy/MaintenanceSystem.js";

test("manutenção reduz condição quando não pode ser paga", () => {
  const budget = new Budget(0);
  const system = new MaintenanceSystem({ budget });
  const item = { id: "wall", maintenanceCost: 100, condition: 1, maintenanceDebt: 0 };
  const result = system.run([item]);
  assert.equal(result.debt, 100);
  assert.ok(item.condition < 1);
  assert.equal(item.maintenanceDebt, 100);
});
