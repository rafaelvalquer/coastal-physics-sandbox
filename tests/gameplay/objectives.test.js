import test from "node:test";
import assert from "node:assert/strict";
import { ObjectiveManager } from "../../src/gameplay/objectives/ObjectiveManager.js";
import { FailureManager } from "../../src/gameplay/objectives/FailureManager.js";

test("objetivos compostos exigem tempo, população e infraestrutura crítica", () => {
  const scenario = {
    goals: {
      surviveYears: 10,
      minPopulationRatio: 0.8,
      criticalBuildings: ["city-hall", "hospital"]
    }
  };
  const manager = new ObjectiveManager({ scenario });
  const result = manager.evaluate({
    yearsSurvived: 10,
    populationRatio: 0.9,
    buildings: {
      "city-hall": { operational: true },
      hospital: { operational: true }
    }
  });
  assert.ok(result.completed.includes("SURVIVE_YEARS"));
  assert.ok(result.completed.includes("MAINTAIN_POPULATION"));
  assert.ok(result.completed.includes("PROTECT_CITY_HALL"));

  const failure = new FailureManager().evaluate({
    populationRatio: 0.9,
    buildings: { "city-hall": { integrity: 0 } }
  });
  assert.equal(failure.failed, true);
});
