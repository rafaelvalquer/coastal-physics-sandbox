import test from "node:test";
import assert from "node:assert/strict";
import { ConstructionJob } from "../../src/gameplay/jobs/ConstructionJob.js";

test("mais trabalhadores aceleram a obra sem escala linear infinita", () => {
  const slow = new ConstructionJob({ laborHours: 4, workersRequired: 2, desiredWorkers: 2 });
  slow.assignedWorkers = 2;
  slow.update(1);

  const fast = new ConstructionJob({ laborHours: 4, workersRequired: 2, desiredWorkers: 8 });
  fast.assignedWorkers = 8;
  fast.update(1);

  assert.ok(fast.progress > slow.progress);
  assert.ok(fast.progress < slow.progress * 4);
});

test("obra sem trabalhadores aguarda mão de obra", () => {
  const job = new ConstructionJob({ laborHours: 1, workersRequired: 2 });
  job.assignedWorkers = 0;
  job.update(1);
  assert.equal(job.state, "WAITING_WORKERS");
  assert.equal(job.progress, 0);
});
