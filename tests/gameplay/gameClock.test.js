import test from "node:test";
import assert from "node:assert/strict";
import { GameClock } from "../../src/core/GameClock.js";

test("GameClock suporta pausa e velocidades 1x/2x/4x/8x", () => {
  const clock = new GameClock({ minutesPerRealSecond: 30 });
  clock.setSpeed(2);
  clock.update(1);
  assert.equal(clock.gameMinutes, 60);

  clock.pause();
  clock.update(10);
  assert.equal(clock.gameMinutes, 60);

  clock.setSpeed(8);
  clock.update(1);
  assert.equal(clock.gameMinutes, 300);
});
