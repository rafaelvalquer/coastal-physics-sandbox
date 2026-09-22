import test from "node:test";
import assert from "node:assert/strict";
import { GameClock } from "../../src/core/GameClock.js";
import { SeededRandom } from "../../src/core/SeededRandom.js";
import { WeatherDirector } from "../../src/gameplay/weather/WeatherDirector.js";
import { ClimateProfile } from "../../src/gameplay/weather/ClimateProfile.js";

test("previsão fica oculta até a janela de 48 horas e é anunciada uma única vez", () => {
  const clock = new GameClock();
  const events = [];
  const director = new WeatherDirector({
    random: new SeededRandom("FORECAST_WINDOW"),
    eventBus: { emit: (type) => events.push(type) },
    profile: new ClimateProfile({ stormChancePerDay: 0 })
  });

  const start = new Date(clock.getDate().getTime() + 60 * 36e5);
  director.schedule(start, {
    targetWaveHeight: 2.8,
    stormSurge: 0.8,
    maxWindSpeed: 70,
    rainfallRate: 30,
    approachDuration: 10,
    peakDuration: 4,
    decayDuration: 8,
    intensity: 0.8
  });

  director.update(0.1, clock);
  assert.equal(director.getForecast(3), null);

  clock.gameMinutes = 13 * 60;
  director.update(0.1, clock);
  assert.ok(director.getForecast(3));
  assert.equal(events.filter((type) => type === "storm:forecast").length, 1);

  director.update(0.1, clock);
  assert.equal(events.filter((type) => type === "storm:forecast").length, 1);
});
