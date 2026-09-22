import test from "node:test";
import assert from "node:assert/strict";
import { OvertoppingSystem } from "../../src/gameplay/ocean/OvertoppingSystem.js";

test("overtopping é detectado quando existe água fisicamente atrás da defesa", () => {
  const h = new Float32Array(80);
  const bed = new Float32Array(80).fill(300);
  h[27] = 6;

  const water = {
    n: 80,
    dx: 4,
    h,
    bed,
    q: new Float32Array(80),
    time: 10,
    velocityAtIndex: (index) => index === 27 ? 28 : 0
  };

  const wall = {
    id: "wall-1",
    type: "CONCRETE_WALL",
    x: 40,
    y: 400,
    length: 10,
    operational: true
  };

  const events = [];
  const system = new OvertoppingSystem({
    water,
    constructions: { list: () => [wall] },
    eventBus: { emit: (type, payload) => events.push({ type, payload }) }
  });

  system.update(0.1);
  assert.equal(system.activeCount, 1);
  assert.equal(wall.overtopping.active, true);
  assert.ok(events.some((event) => event.type === "coast:overtopping"));
});
