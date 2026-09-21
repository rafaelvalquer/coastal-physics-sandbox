import { MATERIALS } from '../world/materials.js';
import { seededRandom } from '../utils/math.js';

export class GranularSystem {
  constructor(terrain, particles) {
    this.terrain = terrain;
    this.particles = particles;
    this.accumulator = 0;
    this.seed = { value: 424242 };
  }

  swap(x1, y1, x2, y2) {
    const a = this.terrain.index(x1, y1);
    const b = this.terrain.index(x2, y2);
    const mat = this.terrain.material[a];
    const integ = this.terrain.integrity[a];
    const moisture = this.terrain.moisture[a];
    this.terrain.material[a] = this.terrain.material[b];
    this.terrain.integrity[a] = this.terrain.integrity[b];
    this.terrain.moisture[a] = this.terrain.moisture[b];
    this.terrain.material[b] = mat;
    this.terrain.integrity[b] = integ;
    this.terrain.moisture[b] = moisture;
  }

  tryMove(x, y, targetX, targetY) {
    if (!this.terrain.inBounds(targetX, targetY)) return false;
    if (this.terrain.getMaterialId(targetX, targetY) !== MATERIALS.AIR.id) return false;
    this.swap(x, y, targetX, targetY);
    return true;
  }

  update(dt) {
    this.accumulator += dt;
    if (this.accumulator < 1 / 30) return;
    this.accumulator = 0;

    const { cols, rows } = this.terrain;
    const leftFirst = seededRandom(this.seed) > 0.5;

    for (let y = rows - 2; y >= 0; y--) {
      for (let x = 1; x < cols - 1; x++) {
        const id = this.terrain.getMaterialId(x, y);
        if (id === MATERIALS.SAND.id || id === MATERIALS.GRAVEL.id) {
          if (this.tryMove(x, y, x, y + 1)) continue;
          const dirs = leftFirst ? [-1, 1] : [1, -1];
          if (this.tryMove(x, y, x + dirs[0], y + 1)) continue;
          this.tryMove(x, y, x + dirs[1], y + 1);
          continue;
        }

        if (id === MATERIALS.SOIL.id || id === MATERIALS.CLAY.id) {
          const idx = this.terrain.index(x, y);
          const moisture = this.terrain.moisture[idx];
          if (moisture < 0.72) continue;
          const belowAir = this.terrain.getMaterialId(x, y + 1) === MATERIALS.AIR.id;
          const diagL = this.terrain.getMaterialId(x - 1, y + 1) === MATERIALS.AIR.id;
          const diagR = this.terrain.getMaterialId(x + 1, y + 1) === MATERIALS.AIR.id;
          const probability = (moisture - 0.72) * 0.72;
          if (seededRandom(this.seed) < probability) {
            if (belowAir) this.tryMove(x, y, x, y + 1);
            else if (diagL || diagR) {
              const tx = diagL && diagR ? x + (seededRandom(this.seed) < 0.5 ? -1 : 1) : x + (diagL ? -1 : 1);
              this.tryMove(x, y, tx, y + 1);
            }
          }
        }
      }
    }
  }
}
