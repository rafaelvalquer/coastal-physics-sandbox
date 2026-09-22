import test from "node:test";
import assert from "node:assert/strict";
import { migrateSaveToV2 } from "../../src/gameplay/save/SaveMigrationV2.js";

test("save v1 é migrado mantendo construções antigas como legacy", () => {
  const migrated = migrateSaveToV2({
    saveVersion: 1,
    constructions: [{ id: "coastal-1", type: "CONCRETE_WALL" }]
  });
  assert.equal(migrated.saveVersion, 2);
  assert.equal(migrated.constructions[0].legacyAssembly, true);
  assert.deepEqual(migrated.structuralEngineering.blocks, []);
});

test("save v2 não é reescrito", () => {
  const value = { saveVersion: 2, structuralEngineering: { blocks: [{ id: "b" }] } };
  assert.equal(migrateSaveToV2(value), value);
});
