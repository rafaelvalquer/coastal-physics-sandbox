const PX_PER_METER = 48;

export class CoastalRunupSystem {
  constructor({ water, terrain, eventBus }) {
    this.water = water;
    this.terrain = terrain;
    this.eventBus = eventBus;
    this.baselineShorelineX = this.findBaselineShoreline();
    this.frontX = this.baselineShorelineX;
    this.previousFrontX = this.frontX;
    this.speed = 0;
    this.maxReachMeters = 0;
    this.maxElevationMeters = 0;
  }

  findBaselineShoreline() {
    const sea = this.water.baseSeaElevation;
    for (let i = 0; i < this.water.n; i++) {
      if (this.water.bed[i] >= sea - 0.5) return (i + 0.5) * this.water.dx;
    }
    return this.water.n * this.water.dx * 0.5;
  }

  update(dt) {
    let furthest = this.baselineShorelineX;
    let maxEta = this.water.baseSeaElevation;

    for (let i = 0; i < this.water.n; i++) {
      const x = (i + 0.5) * this.water.dx;
      if (x < this.baselineShorelineX) continue;
      const depthMeters = this.water.h[i] / PX_PER_METER;
      if (depthMeters < 0.025) continue;
      furthest = Math.max(furthest, x);
      maxEta = Math.max(maxEta, this.water.bed[i] + this.water.h[i]);
    }

    this.previousFrontX = this.frontX;
    this.frontX = furthest;
    const rawSpeed = dt > 0 ? (this.frontX - this.previousFrontX) / PX_PER_METER / dt : 0;
    this.speed += (rawSpeed - this.speed) * Math.min(1, dt * 4);

    const reach = Math.max(0, (this.frontX - this.baselineShorelineX) / PX_PER_METER);
    const elevation = Math.max(0, (maxEta - this.water.baseSeaElevation) / PX_PER_METER);
    this.maxReachMeters = Math.max(this.maxReachMeters, reach);
    this.maxElevationMeters = Math.max(this.maxElevationMeters, elevation);

    return this.snapshot();
  }

  snapshot() {
    return {
      baselineShorelineX: this.baselineShorelineX,
      frontX: this.frontX,
      speed: this.speed,
      reachMeters: Math.max(0, (this.frontX - this.baselineShorelineX) / PX_PER_METER),
      maxReachMeters: this.maxReachMeters,
      maxElevationMeters: this.maxElevationMeters
    };
  }

  serialize() {
    return this.snapshot();
  }

  hydrate(value = {}) {
    this.baselineShorelineX = Number(value.baselineShorelineX || this.baselineShorelineX);
    this.frontX = Number(value.frontX || this.baselineShorelineX);
    this.previousFrontX = this.frontX;
    this.speed = Number(value.speed || 0);
    this.maxReachMeters = Number(value.maxReachMeters || 0);
    this.maxElevationMeters = Number(value.maxElevationMeters || 0);
  }
}
