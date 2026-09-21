import assert from 'node:assert/strict';
import { TerrainGrid } from '../src/engine/world/TerrainGrid.js';
import { AtmosphereSystem } from '../src/engine/physics/AtmosphereSystem.js';
import { WaterSolver } from '../src/engine/physics/WaterSolver.js';
import { SurfaceWaveSolver } from '../src/engine/physics/SurfaceWaveSolver.js';
import { ErosionSystem } from '../src/engine/physics/ErosionSystem.js';
import { MoistureSystem } from '../src/engine/physics/MoistureSystem.js';
import { GranularSystem } from '../src/engine/physics/GranularSystem.js';
import { ParticleSystem } from '../src/engine/particles/ParticleSystem.js';
import { WORLD } from '../src/engine/world/constants.js';

function makeWorld(env = {}) {
  const terrain = new TerrainGrid();
  const atmosphere = new AtmosphereSystem();
  Object.assign(atmosphere, env);
  const particles = new ParticleSystem();
  const water = new WaterSolver(terrain, atmosphere, particles);
  const waves = new SurfaceWaveSolver(water, atmosphere);
  const erosion = new ErosionSystem(terrain, water, waves, particles);
  const moisture = new MoistureSystem(terrain, water, atmosphere);
  const granular = new GranularSystem(terrain, particles);
  return { terrain, atmosphere, particles, water, waves, erosion, moisture, granular };
}

function assertFinite(world) {
  for (const array of [world.water.h, world.water.q, world.water.sediment, world.waves.displacement]) {
    for (const value of array) assert.ok(Number.isFinite(value), 'solver produced a non-finite number');
  }
}

// Hydrostatic well-balanced test: water only, terrain fixed, no forcing.
{
  const w = makeWorld({ wind: 0, gustiness: 0, rain: 0, tide: 0 });
  const initialVolume = w.water.totalVolume;
  for (let step = 0; step < 1200; step++) {
    w.atmosphere.update(WORLD.fixedDt);
    w.water.update(WORLD.fixedDt);
    w.waves.update(WORLD.fixedDt);
  }
  assert.ok(Math.abs(w.water.totalVolume - initialVolume) < 0.01, 'lake-at-rest should conserve volume');
  assertFinite(w);
}

// Coupled-system stress test.
{
  const w = makeWorld({ wind: 28, gustiness: 0.9, rain: 90, tide: 1.2 });
  for (let step = 0; step < 1200; step++) {
    const dt = WORLD.fixedDt;
    w.atmosphere.update(dt);
    w.water.update(dt);
    w.waves.update(dt);
    w.erosion.update(dt);
    w.moisture.update(dt);
    w.granular.update(dt);
    w.particles.update(dt, w.water, w.terrain);
    if (step % 120 === 0) assertFinite(w);
  }
  assert.ok(w.water.totalVolume > 0, 'world should retain water');
  assert.ok(w.terrain.erodedCells >= 0, 'erosion counter must remain valid');
}

console.log('Physics smoke tests: OK');
