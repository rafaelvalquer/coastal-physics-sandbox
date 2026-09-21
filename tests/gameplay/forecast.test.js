import test from "node:test";
import assert from "node:assert/strict";
import { SeededRandom } from "../../src/core/SeededRandom.js";
import { ForecastSystem } from "../../src/gameplay/weather/ForecastSystem.js";

test("previsão expõe intervalos sem alterar a tempestade", () => {
  const forecast = new ForecastSystem(new SeededRandom("forecast"));
  const storm = { maxWindSpeed: 90, intensity: 0.8, stormSurge: 1, rainfallRate: 70 };
  const original = JSON.stringify(storm);
  const result = forecast.forecast(storm, 3);
  assert.equal(result.confidence, "MEDIUM");
  assert.equal(result.wind.length, 2);
  assert.equal(JSON.stringify(storm), original);
});
