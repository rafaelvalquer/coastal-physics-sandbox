import test from "node:test";
import assert from "node:assert/strict";
import { SeededRandom } from "../../src/core/SeededRandom.js";
import { GameClock } from "../../src/core/GameClock.js";
import { ClimateProfile } from "../../src/gameplay/weather/ClimateProfile.js";
import { WeatherDirector } from "../../src/gameplay/weather/WeatherDirector.js";

test("tempestade percorre aproximação, pico, afastamento e termina", () => {
  const clock = new GameClock({ minutesPerRealSecond: 60 });
  const director = new WeatherDirector({
    random: new SeededRandom("lifecycle"),
    profile: new ClimateProfile({ stormChancePerDay: 0 })
  });
  director.nextStorm = {
    id: "fast",
    name: "Fast",
    startDate: clock.getDate(),
    approachDuration: 0.01,
    peakDuration: 0.01,
    decayDuration: 0.01,
    maxWindSpeed: 80,
    rainfallRate: 40,
    stormSurge: 0.8,
    direction: 90,
    intensity: 0.8
  };

  for (let i = 0; i < 20; i++) director.update(0.1, clock);
  assert.equal(director.activeStorm, null);
  assert.equal(director.phase, "CALM");
});
