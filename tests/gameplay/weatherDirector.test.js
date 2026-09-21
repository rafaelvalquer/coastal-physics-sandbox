import test from "node:test";
import assert from "node:assert/strict";
import { SeededRandom } from "../../src/core/SeededRandom.js";
import { GameClock } from "../../src/core/GameClock.js";
import { ClimateProfile } from "../../src/gameplay/weather/ClimateProfile.js";
import { WeatherDirector } from "../../src/gameplay/weather/WeatherDirector.js";

test("WeatherDirector inicia tempestade programada sem salto instantâneo", () => {
  const clock = new GameClock({ minutesPerRealSecond: 60 });
  const director = new WeatherDirector({
    random: new SeededRandom("weather"),
    profile: new ClimateProfile({ stormChancePerDay: 0 })
  });
  director.nextStorm = {
    id: "manual",
    name: "Teste",
    startDate: clock.getDate(),
    approachDuration: 2,
    peakDuration: 1,
    decayDuration: 2,
    maxWindSpeed: 100,
    rainfallRate: 80,
    stormSurge: 1.2,
    direction: 90,
    intensity: 1
  };
  const before = director.state.windSpeed;
  director.update(0.1, clock);
  assert.equal(director.phase, "APPROACH");
  assert.ok(director.state.windSpeed > before);
  assert.ok(director.state.windSpeed < 100);
});
