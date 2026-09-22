export class EnergyBalance {
  constructor() { this.reset(); }
  reset() { this.kinetic = 0; this.potential = 0; this.wave = 0; this.dissipated = 0; this.breaking = 0; this.friction = 0; this.impacts = 0; }
  snapshot() { return { ...this }; }
}
