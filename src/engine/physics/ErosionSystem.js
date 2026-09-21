import { MATERIALS } from '../world/materials.js';
import { WORLD } from '../world/constants.js';
import { clamp } from '../utils/math.js';

const PX_PER_METER = 48;

export class ErosionSystem {
  constructor(terrain, water, surfaceWaves, particles) {
    this.terrain = terrain;
    this.water = water;
    this.surfaceWaves = surfaceWaves;
    this.particles = particles;
    this.deposition = new Float32Array(terrain.cols);
    this.totalSedimentReleased = 0;
    this.totalSedimentDeposited = 0;
  }

  update(dt) {
    const dx = this.water.dx;

    for (let i = 1; i < this.water.n - 1; i++) {
      const h = this.water.h[i];
      if (h <= 0.2) continue;

      const worldX = (i + 0.5) * dx;
      const surface = this.terrain.surfaceCellForWorldX(worldX);
      if (surface.y >= this.terrain.rows) continue;

      const topCellY = surface.y;
      const mat = this.terrain.getMaterial(surface.x, topCellY);
      if (!mat.solid) continue;

      const idx = this.terrain.index(surface.x, topCellY);
      const moisture = this.terrain.moisture[idx] || 0;
      const u = Math.abs(this.water.velocityAtIndex(i)) / PX_PER_METER;
      const rippleV = Math.abs(this.surfaceWaves.velocity[i]) / PX_PER_METER;
      const breaking = this.water.breaking[i];

      // Bed shear stress: tau ≈ 1/2 rho Cf U² + wave orbital contribution.
      const rho = 1000;
      const cf = 0.0065;
      const currentShear = 0.5 * rho * cf * u * u;
      const orbitalShear = 0.5 * rho * 0.009 * rippleV * rippleV;
      // Breaker impact only carries erosive power when water/orbital motion is present.
      // This avoids a static wet/dry shoreline producing erosion by geometry alone.
      const breakerVelocity = u + rippleV;
      const breakerImpulse = 0.5 * rho * 0.015 * breakerVelocity * breakerVelocity * breaking;
      const shear = currentShear + orbitalShear + breakerImpulse;

      const saturationWeakening = 1 - moisture * (mat.key === 'SOIL' || mat.key === 'CLAY' ? 0.58 : 0.28);
      const threshold = mat.criticalShear * clamp(saturationWeakening, 0.34, 1);

      if (shear > threshold && Number.isFinite(threshold)) {
        const excess = clamp((shear - threshold) / Math.max(0.05, threshold), 0, 8);
        const damage = mat.erodibility * excess * 0.85 * dt;
        const result = this.terrain.damageCell(surface.x, topCellY, damage);
        const sedimentGain = damage * (mat.key === 'ROCK' || mat.key === 'CONCRETE' ? 0.018 : 0.075);
        this.water.sediment[i] += sedimentGain;
        this.totalSedimentReleased += sedimentGain;

        if (result.removed) {
          const pulse = mat.key === 'SAND' ? 0.95 : mat.key === 'SOIL' ? 0.75 : 0.35;
          this.water.sediment[i] += pulse;
          this.totalSedimentReleased += pulse;
          this.particles?.spawnSediment(worldX, topCellY * this.terrain.cellSize, this.water.velocityAtIndex(i));
        }
      }

      this.handleDeposition(i, surface.x, dt);
    }
  }

  handleDeposition(i, terrainCol, dt) {
    const h = this.water.h[i];
    const speed = Math.abs(this.water.velocityAtIndex(i)) / PX_PER_METER;
    const breaking = this.water.breaking[i];
    const concentration = this.water.sediment[i];
    if (concentration <= 0.0001 || h <= 0.1) return;

    // Transport capacity grows non-linearly with flow speed and turbulence.
    const capacity = 0.08 + 0.22 * speed * speed + 0.16 * breaking;
    if (concentration <= capacity) return;

    const settling = Math.min(concentration - capacity, (0.18 + 0.3 / (1 + speed * 2.5)) * dt);
    this.water.sediment[i] = Math.max(0, concentration - settling);
    this.deposition[terrainCol] += settling;

    if (this.deposition[terrainCol] >= 0.74) {
      const top = this.terrain.columnTopCell(terrainCol);
      const y = top - 1;
      if (y >= 0 && this.terrain.getMaterialId(terrainCol, y) === MATERIALS.AIR.id) {
        const worldX = (terrainCol + 0.5) * this.terrain.cellSize;
        const surfaceY = this.water.surfaceYAtX(worldX);
        const cellCenterY = (y + 0.5) * this.terrain.cellSize;
        if (cellCenterY > surfaceY - this.terrain.cellSize * 0.2) {
          this.terrain.setCell(terrainCol, y, MATERIALS.SAND.id, 0.7, 0.82);
          this.deposition[terrainCol] -= 0.74;
          this.totalSedimentDeposited += 0.74;
        }
      }
    }
  }

  serialize() {
    return {
      deposition: Array.from(this.deposition),
      totalSedimentReleased: this.totalSedimentReleased,
      totalSedimentDeposited: this.totalSedimentDeposited
    };
  }

  hydrate(data) {
    if (!data) return;
    if (data.deposition?.length === this.deposition.length) this.deposition.set(data.deposition);
    this.totalSedimentReleased = Number(data.totalSedimentReleased || 0);
    this.totalSedimentDeposited = Number(data.totalSedimentDeposited || 0);
  }
}
