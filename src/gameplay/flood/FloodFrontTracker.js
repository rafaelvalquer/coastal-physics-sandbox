const PX_PER_METER = 48;

export class FloodFrontTracker {
  constructor({ water, shorelineX, buildings }) {
    this.water = water;
    this.shorelineX = shorelineX;
    this.buildings = buildings;
    this.frontX = shorelineX;
    this.previousX = shorelineX;
    this.speed = 0;
    this.maxFrontX = shorelineX;
    this.maxDepth = 0;
  }

  update(dt) {
    let front = this.shorelineX;
    let maxDepth = 0;

    for (let i = 0; i < this.water.n; i++) {
      const x = (i + 0.5) * this.water.dx;
      if (x < this.shorelineX) continue;
      const depth = this.water.h[i] / PX_PER_METER;
      maxDepth = Math.max(maxDepth, depth);
      if (depth >= 0.05) front = Math.max(front, x);
    }

    this.previousX = this.frontX;
    this.frontX = front;
    const raw = dt > 0 ? (this.frontX - this.previousX) / PX_PER_METER / dt : 0;
    this.speed += (raw - this.speed) * Math.min(1, dt * 3);
    this.maxFrontX = Math.max(this.maxFrontX, this.frontX);
    this.maxDepth = Math.max(this.maxDepth, maxDepth);

    const hospital = this.buildings.get("hospital");
    const distanceToHospital = hospital
      ? Math.max(0, (hospital.x - this.frontX) / PX_PER_METER)
      : null;

    return {
      frontX: this.frontX,
      speed: this.speed,
      maxFrontX: this.maxFrontX,
      maxDepth: this.maxDepth,
      distanceToHospital
    };
  }

  snapshot() {
    const hospital = this.buildings.get("hospital");
    return {
      frontX: this.frontX,
      speed: this.speed,
      maxFrontX: this.maxFrontX,
      maxDepth: this.maxDepth,
      distanceToHospital: hospital ? Math.max(0, (hospital.x - this.frontX) / PX_PER_METER) : null
    };
  }

  serialize() {
    return this.snapshot();
  }

  hydrate(value = {}) {
    Object.assign(this, value);
    this.previousX = this.frontX;
  }
}
