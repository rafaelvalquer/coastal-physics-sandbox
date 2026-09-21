import { WORLD } from '../world/constants.js';
import { clamp, smoothNoise1D } from '../utils/math.js';

export class SurfaceWaveSolver {
  constructor(water, atmosphere) {
    this.water = water;
    this.atmosphere = atmosphere;
    this.n = water.n;
    this.displacement = new Float32Array(this.n);
    this.velocity = new Float32Array(this.n);
    this.nextVelocity = new Float32Array(this.n);
    this.time = 0;
  }

  addImpulse(x, magnitude = 1) {
    const center = clamp(Math.floor(x / this.water.dx), 0, this.n - 1);
    for (let d = -8; d <= 8; d++) {
      const i = center + d;
      if (i < 0 || i >= this.n) continue;
      const w = Math.exp(-(d * d) / 16);
      this.velocity[i] += magnitude * 95 * w;
    }
  }

  update(dt) {
    this.time += dt;
    const k = 28;
    const damping = 2.8;
    const coupling = 72;
    let mean = 0;
    let wetCount = 0;

    for (let i = 0; i < this.n; i++) {
      if (this.water.h[i] <= 0.1) {
        this.displacement[i] *= Math.exp(-dt * 12);
        this.velocity[i] *= Math.exp(-dt * 12);
        continue;
      }
      const left = this.displacement[Math.max(0, i - 1)];
      const right = this.displacement[Math.min(this.n - 1, i + 1)];
      const lap = left + right - 2 * this.displacement[i];
      let acceleration = -k * this.displacement[i] - damping * this.velocity[i] + coupling * lap;

      const wind = Math.abs(this.atmosphere.windAt(i / (this.n - 1)));
      const coherent = smoothNoise1D(i * 0.19 + this.time * (0.8 + wind * 0.025), 703);
      acceleration += coherent * wind * this.atmosphere.gustiness * 0.42;

      // Breaking rapidly damps high-frequency surface ripples.
      acceleration -= this.velocity[i] * this.water.breaking[i] * 5;
      this.nextVelocity[i] = this.velocity[i] + acceleration * dt;
    }

    for (let i = 0; i < this.n; i++) {
      if (this.water.h[i] <= 0.1) continue;
      this.velocity[i] = this.nextVelocity[i];
      this.displacement[i] += this.velocity[i] * dt;
      this.displacement[i] = clamp(this.displacement[i], -14, 14);
      mean += this.displacement[i];
      wetCount++;
    }

    // Remove DC offset: visual ripples cannot create/destroy water volume.
    if (wetCount > 0) {
      mean /= wetCount;
      for (let i = 0; i < this.n; i++) {
        if (this.water.h[i] > 0.1) this.displacement[i] -= mean * 0.035;
      }
    }
  }

  serialize() {
    return {
      displacement: Array.from(this.displacement),
      velocity: Array.from(this.velocity),
      time: this.time
    };
  }

  hydrate(data) {
    if (!data) return;
    if (data.displacement?.length === this.n) this.displacement.set(data.displacement);
    if (data.velocity?.length === this.n) this.velocity.set(data.velocity);
    this.time = Number(data.time || 0);
  }
}
