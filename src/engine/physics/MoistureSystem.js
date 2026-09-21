import { MATERIAL_BY_ID, MATERIALS } from '../world/materials.js';

export class MoistureSystem {
  constructor(terrain, water, atmosphere) {
    this.terrain = terrain;
    this.water = water;
    this.atmosphere = atmosphere;
    this.accumulator = 0;
  }

  update(dt) {
    this.accumulator += dt;
    if (this.accumulator < 1 / 18) return;
    dt = this.accumulator;
    this.accumulator = 0;

    const { cols, rows, cellSize } = this.terrain;
    const next = new Float32Array(this.terrain.moisture);

    for (let x = 0; x < cols; x++) {
      const top = this.terrain.columnTopCell(x);
      const worldX = (x + 0.5) * cellSize;
      const waterY = this.water.surfaceYAtX(worldX);

      for (let y = top; y < Math.min(rows, top + 12); y++) {
        const idx = this.terrain.index(x, y);
        const mat = MATERIAL_BY_ID[this.terrain.material[idx]] || MATERIALS.AIR;
        if (!mat.solid) continue;

        let m = this.terrain.moisture[idx];
        const cellY = (y + 0.5) * cellSize;
        const submerged = cellY > waterY && this.water.depthAtX(worldX) > 0.15;
        if (submerged) {
          m += (1 - m) * mat.permeability * dt * 1.9;
        }

        if (y === top && this.atmosphere.rain > 0) {
          m += (1 - m) * Math.min(1, this.atmosphere.rain / 70) * mat.permeability * dt * 0.65;
        }

        const above = y > 0 ? this.terrain.moisture[this.terrain.index(x, y - 1)] : 0;
        const below = y + 1 < rows ? this.terrain.moisture[this.terrain.index(x, y + 1)] : m;
        const lateralL = x > 0 ? this.terrain.moisture[this.terrain.index(x - 1, y)] : m;
        const lateralR = x + 1 < cols ? this.terrain.moisture[this.terrain.index(x + 1, y)] : m;

        const verticalDrive = (above - m) * 0.75 + (below - m) * 0.08;
        const lateralDrive = (lateralL + lateralR - 2 * m) * 0.12;
        m += (verticalDrive + lateralDrive) * mat.permeability * dt;

        if (!submerged && this.atmosphere.rain < 1) m -= dt * 0.0018 * (1 - mat.permeability * 0.4);
        next[idx] = Math.max(0, Math.min(1, m));
      }
    }

    this.terrain.moisture.set(next);
  }
}
