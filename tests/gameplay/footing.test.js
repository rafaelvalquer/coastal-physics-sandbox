import test from "node:test";
import assert from "node:assert/strict";
import { Footing } from "../../src/gameplay/foundation/Footing.js";

test("sapata aumenta base e adiciona massa resistente", () => {
  const footing = new Footing({ x: 600, y: 480 });
  assert.equal(footing.kind, "FOOTING");
  assert.ok(footing.width >= 2);
  assert.ok(footing.mass >= 2500);
  assert.ok(footing.bearingMultiplier > 1);
});
