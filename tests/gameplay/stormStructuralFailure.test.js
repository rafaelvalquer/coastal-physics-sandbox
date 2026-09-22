import test from "node:test";
import assert from "node:assert/strict";
import { StructuralFailureSystem } from "../../src/gameplay/structural/StructuralFailureSystem.js";

test("estrutura com FS muito baixo entra em falha e identifica modo crítico", () => {
  const events = [];
  const system = new StructuralFailureSystem({ eventBus: { emit: (type, payload) => events.push({ type, payload }) } });
  const assembly = {
    id: "wall-a",
    failed: false,
    condition: 1,
    rotation: 0,
    angularVelocity: 0,
    displacementX: 0,
    blocks: [{ integrity: 1, connected: true, displacementX: 0, rotation: 0 }],
    stability: {
      minimumFactor: 0.5,
      sliding: { factor: 0.5 },
      overturning: { factor: 0.9 },
      uplift: { factor: 1.4 },
      foundation: { factor: 1.2 },
      forces: { velocity: 2 }
    }
  };
  system.update(assembly, 1);
  assert.equal(assembly.failed, true);
  assert.equal(assembly.failureMode, "SLIDING");
  assert.ok(events.some((event) => event.type === "structural:failed"));
});
