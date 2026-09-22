const PX_PER_METER = 48;
export class RainfallRunoffSystem {
  constructor({ terrain, infiltration }) {
    this.terrain = terrain;
    this.infiltration = infiltration;
    this.totalRainPx = 0;
    this.totalInfiltratedPx = 0;
    this.totalRunoffPx = 0;
  }

  apply({ rainfallMmPerHour = 0, dt, h, dx, hydrologyTimeScale = 1 }) {
    if (rainfallMmPerHour <= 0 || dt <= 0) return { rain: 0, infiltrated: 0, runoff: 0 };
    const rainMetersPerSecond = rainfallMmPerHour / 1000 / 3600;
    const rainDepthPx = rainMetersPerSecond * PX_PER_METER * dt * Math.max(1, hydrologyTimeScale);
    let infiltrated = 0;
    let runoff = 0;
    for (let i = 0; i < h.length; i++) {
      const x = (i + 0.5) * dx;
      const capacityMeters = this.infiltration.capacityAtWorldX(x, rainMetersPerSecond) * dt * Math.max(1, hydrologyTimeScale);
      const infiltratablePx = Math.min(rainDepthPx, capacityMeters * PX_PER_METER);
      const accepted = this.infiltration.infiltrateAtWorldX(x, infiltratablePx);
      const excess = Math.max(0, rainDepthPx - accepted);
      h[i] += excess;
      infiltrated += accepted;
      runoff += excess;
    }
    this.totalRainPx += rainDepthPx * h.length;
    this.totalInfiltratedPx += infiltrated;
    this.totalRunoffPx += runoff;
    return { rain: rainDepthPx * h.length, infiltrated, runoff };
  }
}
