const PX_PER_METER = 48;

const ROUGHNESS = Object.freeze({
  AIR: 0,
  CONCRETE: 0.012,
  ROCK: 0.026,
  GRAVEL: 0.032,
  SOIL: 0.035,
  CLAY: 0.038,
  SAND: 0.04
});

export class BottomFriction {
  static coefficient(materialKey, vegetation = 0) {
    return (ROUGHNESS[materialKey] ?? 0.03) * (1 + Math.max(0, vegetation) * 2.4);
  }

  static acceleration({ velocityPx, depthPx, materialKey, vegetation = 0, gravity = 9.81 }) {
    const h = Math.max(0.02, depthPx / PX_PER_METER);
    const u = velocityPx / PX_PER_METER;
    const n = this.coefficient(materialKey, vegetation);
    const denom = Math.max(0.02, Math.pow(h, 4 / 3));
    const accelMeters = -gravity * n * n * u * Math.abs(u) / denom;
    return accelMeters * PX_PER_METER;
  }

  static shear({ velocityPx, depthPx, materialKey, vegetation = 0, rho = 1000 }) {
    const h = Math.max(0.02, depthPx / PX_PER_METER);
    const u = velocityPx / PX_PER_METER;
    const n = this.coefficient(materialKey, vegetation);
    const cf = Math.min(0.25, 9.81 * n * n / Math.max(0.03, Math.pow(h, 1 / 3)));
    return rho * cf * u * Math.abs(u);
  }
}
