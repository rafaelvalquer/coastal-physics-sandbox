import test from "node:test";
import assert from "node:assert/strict";
import { OffshoreWaveGenerator } from "../../src/gameplay/ocean/OffshoreWaveGenerator.js";

test("OffshoreWaveGenerator alimenta WaterSolver e SurfaceWaveSolver continuamente", () => {
  let waterBoundary = null;
  let surfaceBoundary = null;

  const generator = new OffshoreWaveGenerator({
    water: { setOffshoreBoundary: (value) => { waterBoundary = value; } },
    surfaceWaves: { setBoundaryForcing: (value) => { surfaceBoundary = value; } },
    seaState: {
      state: {
        significantWaveHeight: 0.45,
        wavePeriod: 6.5,
        groupIntensity: 1,
        irregularity: 0.12
      }
    }
  });

  generator.update(0.1);
  assert.ok(waterBoundary);
  assert.ok(surfaceBoundary);
  assert.ok(waterBoundary.waveAmplitudePx > 0);
  assert.ok(surfaceBoundary.amplitudePx > 0);
});
