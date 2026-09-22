const PX_PER_METER = 48;
export class InfiltrationSystem {
  constructor(terrain) { this.terrain = terrain; }

  capacityAtWorldX(x, rainfallMetersPerSecond) {
    const cell = this.terrain.surfaceCellForWorldX(x);
    if (cell.y >= this.terrain.rows) return 0;
    const idx = this.terrain.index(cell.x, cell.y);
    const mat = this.terrain.getMaterial(cell.x, cell.y);
    const saturation = this.terrain.moisture[idx] || 0;
    const permeability = Math.max(0, Math.min(1, mat.permeability ?? 0));
    const baseMetersPerSecond = 2.5e-5 * permeability;
    return Math.min(rainfallMetersPerSecond, baseMetersPerSecond * Math.max(0.03, 1 - saturation));
  }

  infiltrateAtWorldX(x, amountPx) {
    const cell = this.terrain.surfaceCellForWorldX(x);
    if (cell.y >= this.terrain.rows || amountPx <= 0) return 0;
    const idx = this.terrain.index(cell.x, cell.y);
    const mat = this.terrain.getMaterial(cell.x, cell.y);
    if (!mat.solid) return 0;
    const accepted = Math.min(amountPx, amountPx * Math.max(0, Math.min(1, mat.permeability ?? 0)));
    const layers = Math.min(10, this.terrain.rows - cell.y);
    for (let k = 0; k < layers; k++) {
      const i = this.terrain.index(cell.x, cell.y + k);
      this.terrain.moisture[i] = Math.min(1, (this.terrain.moisture[i] || 0) + accepted / PX_PER_METER * 0.35 / (k + 1));
    }
    return accepted;
  }
}
