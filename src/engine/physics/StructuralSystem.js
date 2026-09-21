import { MATERIALS } from '../world/materials.js';

export class StructuralSystem {
  constructor(terrain, rigidBodies) {
    this.terrain = terrain;
    this.rigidBodies = rigidBodies;
    this.accumulator = 0;
  }

  update(dt) {
    this.accumulator += dt;
    if (this.accumulator < 1 / 15) return;
    const step = this.accumulator;
    this.accumulator = 0;

    const { cols, rows, cellSize } = this.terrain;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 2; x < cols - 2; x++) {
        const id = this.terrain.getMaterialId(x, y);
        if (id !== MATERIALS.CONCRETE.id) continue;

        const below = this.terrain.isSolid(x, y + 1);
        if (below) continue;

        let support = 0;
        for (let dx = -2; dx <= 2; dx++) {
          if (this.terrain.isSolid(x + dx, y + 1)) support++;
        }
        const idx = this.terrain.index(x, y);
        if (support === 0) this.terrain.integrity[idx] -= step * 0.36;
        else if (support === 1) this.terrain.integrity[idx] -= step * 0.08;

        if (this.terrain.integrity[idx] <= 0) {
          this.terrain.setCell(x, y, MATERIALS.AIR.id, 0, 0);
          this.rigidBodies.spawn(
            (x + 0.5) * cellSize,
            (y + 0.5) * cellSize,
            cellSize * 0.72,
            cellSize * 0.72,
            2350,
            'concrete'
          );
        }
      }
    }
  }
}
