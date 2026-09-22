import { SurfacePropagation } from "./SurfacePropagation.js";

export class FreeSurfaceDetailSolver {
  constructor(water) {
    this.water = water;
    this.n = water.n;
    this.displacement = new Float32Array(this.n);
    this.velocity = new Float32Array(this.n);
    this.acceleration = new Float32Array(this.n);
    this.spread = new Float32Array(this.n);
    this.boundaryForcing = null;
    this.time = 0;
  }

  addImpulse(x, magnitude = 1, radius = 8) {
    const center = Math.max(0, Math.min(this.n - 1, Math.floor(x / this.water.dx)));
    for (let d = -radius; d <= radius; d++) {
      const i = center + d;
      if (i < 0 || i >= this.n) continue;
      const w = Math.exp(-(d * d) / Math.max(3, radius * 1.5));
      this.velocity[i] += magnitude * 72 * w;
    }
  }

  setBoundaryForcing(value = null) {
    this.boundaryForcing = value ? { ...value } : null;
  }

  update(dt) {
    this.time += dt;
    const stiffness = 18;
    const damping = 2.5;

    for (let i = 0; i < this.n; i++) {
      const h = this.water.h[i];
      if (h <= 0.05) {
        this.displacement[i] *= Math.exp(-dt * 14);
        this.velocity[i] *= Math.exp(-dt * 14);
        this.acceleration[i] = 0;
        this.spread[i] = 0;
        continue;
      }
      const depthFactor = Math.max(0.2, Math.min(1.6, Math.sqrt(h / 48)));
      const breaking = this.water.breaking[i] || 0;
      this.spread[i] = 28 * depthFactor * (1 - breaking * 0.72);
      this.acceleration[i] = -stiffness * this.displacement[i] - damping * this.velocity[i] - breaking * 5 * this.velocity[i];
    }

    for (let i = 0; i < this.n; i++) {
      this.velocity[i] += this.acceleration[i] * dt;
      this.displacement[i] += this.velocity[i] * dt;
      this.displacement[i] = Math.max(-18, Math.min(18, this.displacement[i]));
    }

    SurfacePropagation.iterate(this.displacement, this.velocity, this.spread, dt, 3);

    if (this.boundaryForcing) {
      const target = (this.boundaryForcing.amplitudePx || 0) * (this.boundaryForcing.signal || 0);
      for (let i = 0; i < Math.min(16, this.n); i++) {
        if (this.water.h[i] <= 0.05) continue;
        const weight = Math.exp(-i * 0.18);
        const response = 1 - Math.exp(-dt * (5.5 - i * 0.2));
        this.displacement[i] += (target * weight - this.displacement[i]) * response;
      }
    }

    let mean = 0, count = 0;
    for (let i = 0; i < this.n; i++) if (this.water.h[i] > 0.05) { mean += this.displacement[i]; count++; }
    if (count) {
      mean /= count;
      for (let i = 0; i < this.n; i++) if (this.water.h[i] > 0.05) this.displacement[i] -= mean;
    }
  }

  serialize() { return { displacement:Array.from(this.displacement), velocity:Array.from(this.velocity), time:this.time }; }
  hydrate(data) {
    if (data?.displacement?.length === this.n) this.displacement.set(data.displacement);
    if (data?.velocity?.length === this.n) this.velocity.set(data.velocity);
    this.time = Number(data?.time || 0);
  }
}
