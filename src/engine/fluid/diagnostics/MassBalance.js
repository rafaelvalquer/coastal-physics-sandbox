export class MassBalance {
  constructor() { this.reset(); }
  reset(initial = 0) { this.initial = initial; this.sources = 0; this.sinks = 0; this.current = initial; this.error = 0; }
  source(amount) { this.sources += Number(amount || 0); }
  sink(amount) { this.sinks += Number(amount || 0); }
  update(current) {
    this.current = Number(current || 0);
    const expected = this.initial + this.sources - this.sinks;
    const scale = Math.max(1e-9, Math.abs(expected));
    this.error = (this.current - expected) / scale;
    return this.snapshot();
  }
  snapshot() { return { initial: this.initial, sources: this.sources, sinks: this.sinks, current: this.current, error: this.error }; }
}
