export class MomentumBalance {
  constructor() { this.reset(); }
  reset() { this.boundary = 0; this.wind = 0; this.body = 0; this.friction = 0; this.structure = 0; this.current = 0; }
  snapshot() { return { boundary: this.boundary, wind: this.wind, body: this.body, friction: this.friction, structure: this.structure, current: this.current }; }
}
