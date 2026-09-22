import test from "node:test";
import assert from "node:assert/strict";
import { WorkforceManager } from "../../src/gameplay/workforce/WorkforceManager.js";

test("evacuação reduz trabalhadores disponíveis", () => {
  const population = { population: 132, evacuated: 0, homeless: 0 };
  const manager = new WorkforceManager({ population, targetMunicipalWorkers: 24 });
  const before = manager.snapshot().total;
  population.evacuated = 66;
  const after = manager.updateFromPopulation().total;
  assert.ok(after < before);
});

test("pool respeita serviços essenciais e reserva de emergência", () => {
  const population = { population: 132, evacuated: 0, homeless: 0 };
  const manager = new WorkforceManager({ population, targetMunicipalWorkers: 24 });
  manager.beginCycle();
  const assigned = manager.assign("job-a", 100);
  assert.ok(assigned <= manager.pool.allocatable);
  assert.equal(manager.pool.available, 0);
});
