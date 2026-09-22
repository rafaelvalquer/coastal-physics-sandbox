import test from "node:test";
import assert from "node:assert/strict";
import { GameClock } from "../../src/core/GameClock.js";
import { SeededRandom } from "../../src/core/SeededRandom.js";
import { SeaStateController } from "../../src/gameplay/ocean/SeaStateController.js";

test("mar calmo mantém ondas visíveis e tempestade aumenta progressivamente o estado do mar", () => {
  const clock = new GameClock();
  const weatherDirector = {
    activeStorm: null,
    nextStorm: null,
    phase: "CALM",
    phaseHours: 0,
    forecastLeadHours: 48
  };
  const sea = new SeaStateController({
    weatherDirector,
    clock,
    random: new SeededRandom("SEA_TEST")
  });

  const calm = sea.update(0.1);
  assert.ok(calm.significantWaveHeight >= 0.25);
  assert.ok(calm.visualWaveGain >= 1.5);
  assert.equal(calm.phase, "CALM");

  weatherDirector.activeStorm = {
    targetWaveHeight: 2.8,
    stormSurge: 0.8,
    approachDuration: 10,
    peakDuration: 4,
    decayDuration: 8,
    direction: 90
  };
  weatherDirector.phase = "APPROACH";
  weatherDirector.phaseHours = 9;

  const buildup = sea.update(0.1);
  assert.equal(buildup.phase, "BUILDUP");
  assert.ok(buildup.significantWaveHeight > calm.significantWaveHeight);
  assert.ok(buildup.stormSurge > 0);
});
