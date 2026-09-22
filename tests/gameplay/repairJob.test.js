import test from "node:test";
import assert from "node:assert/strict";
import { RepairJob } from "../../src/gameplay/jobs/RepairJob.js";

test("RepairJob preserva alvo e restauração no save", () => {
  const job = new RepairJob({ targetId: "assembly-1", restoreAmount: 0.3, laborHours: 3 });
  const value = job.serialize();
  assert.equal(value.type, "REPAIR");
  assert.equal(value.targetId, "assembly-1");
  assert.equal(value.restoreAmount, 0.3);
});
