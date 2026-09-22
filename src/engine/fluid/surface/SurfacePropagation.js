export class SurfacePropagation {
  static iterate(displacement, velocity, spread, dt, passes = 3) {
    const n = displacement.length;
    const left = new Float32Array(n);
    const right = new Float32Array(n);
    for (let pass = 0; pass < passes; pass++) {
      for (let i = 1; i < n - 1; i++) {
        left[i] = spread[i] * (displacement[i] - displacement[i - 1]);
        right[i] = spread[i] * (displacement[i] - displacement[i + 1]);
      }
      for (let i = 1; i < n - 1; i++) {
        velocity[i - 1] += left[i] * dt;
        velocity[i + 1] += right[i] * dt;
      }
    }
  }
}
