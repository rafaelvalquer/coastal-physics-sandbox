const PX_PER_METER = 48;
export const SWASH_ZONE = Object.freeze({ OFFSHORE:0, BREAKER:1, SURF:2, SWASH:3, DRY:4 });

export class SwashZoneSystem {
  constructor(size) { this.zone = new Uint8Array(size); }

  update(water) {
    for (let i = 0; i < water.n; i++) {
      const h = water.h[i] / PX_PER_METER;
      const breaking = water.breaking[i] || 0;
      if (h <= 0.01) this.zone[i] = SWASH_ZONE.DRY;
      else if (h < 0.12) this.zone[i] = SWASH_ZONE.SWASH;
      else if (breaking > 0.4) this.zone[i] = SWASH_ZONE.BREAKER;
      else if (h < 1.5 || breaking > 0.08) this.zone[i] = SWASH_ZONE.SURF;
      else this.zone[i] = SWASH_ZONE.OFFSHORE;
    }
    return this.zone;
  }
}
