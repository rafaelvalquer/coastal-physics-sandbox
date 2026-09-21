import test from "node:test";
import assert from "node:assert/strict";
import { Budget } from "../../src/gameplay/economy/Budget.js";

test("Budget bloqueia gasto sem saldo e registra transações", () => {
  const budget = new Budget(1000);
  assert.equal(budget.spend(400, "CONSTRUCTION", "wall"), true);
  assert.equal(budget.balance, 600);
  assert.equal(budget.spend(700), false);
  budget.credit(250, "REVENUE", "tax");
  assert.equal(budget.balance, 850);
  assert.equal(budget.ledger.list().length, 2);
});
