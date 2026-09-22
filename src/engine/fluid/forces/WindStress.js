const RHO_AIR = 1.225;
const RHO_WATER = 1000;
const PX_PER_METER = 48;

export class WindStress {
  static stress(windMeters, waterVelocityMeters = 0) {
    const rel = windMeters - waterVelocityMeters;
    const cd = 0.0012 + 0.00005 * Math.min(40, Math.abs(windMeters));
    return RHO_AIR * cd * rel * Math.abs(rel);
  }

  static acceleration(windMeters, waterVelocityPx, depthPx) {
    const h = Math.max(0.04, depthPx / PX_PER_METER);
    const u = waterVelocityPx / PX_PER_METER;
    return (this.stress(windMeters, u) / (RHO_WATER * h)) * PX_PER_METER;
  }
}
