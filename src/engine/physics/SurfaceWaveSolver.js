import { FreeSurfaceDetailSolver } from "../fluid/surface/FreeSurfaceDetailSolver.js";

export class SurfaceWaveSolver extends FreeSurfaceDetailSolver {
  constructor(water, atmosphere) {
    super(water);
    this.atmosphere = atmosphere;
  }

  update(dt) {
    super.update(dt);
    const gust = Math.abs(this.atmosphere?.wind || 0) * (this.atmosphere?.gustiness || 0);
    if (gust <= 0.02) return;
    for (let i = 1; i < this.n - 1; i += 5) {
      if (this.water.h[i] <= 0.05) continue;
      const forcing = Math.sin(this.time * 1.7 + i * 0.43) * gust * 0.006;
      this.velocity[i] += forcing;
    }
  }
}
