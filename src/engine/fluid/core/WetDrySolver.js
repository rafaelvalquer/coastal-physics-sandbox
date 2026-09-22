export const WET_DRY_STATE = Object.freeze({ DRY: 0, WETTING: 1, WET: 2, DRYING: 3 });

export class WetDrySolver {
  constructor(size, { dryDepth = 0.05, wetDepth = 0.12 } = {}) {
    this.dryDepth = dryDepth;
    this.wetDepth = wetDepth;
    this.state = new Uint8Array(size);
  }

  classify(h, previous = WET_DRY_STATE.DRY) {
    if (h <= this.dryDepth) return previous === WET_DRY_STATE.WET ? WET_DRY_STATE.DRYING : WET_DRY_STATE.DRY;
    if (h < this.wetDepth) return previous === WET_DRY_STATE.DRY ? WET_DRY_STATE.WETTING : WET_DRY_STATE.DRYING;
    return previous === WET_DRY_STATE.DRY ? WET_DRY_STATE.WETTING : WET_DRY_STATE.WET;
  }

  enforce(h, hu, i) {
    const previous = this.state[i];
    const next = this.classify(h, previous);
    this.state[i] = next;
    if (h <= this.dryDepth || !Number.isFinite(h) || !Number.isFinite(hu)) {
      return { h: 0, hu: 0, state: WET_DRY_STATE.DRY };
    }
    return { h: Math.max(0, h), hu, state: next };
  }
}
