export class StormSurgeSystem {
  constructor() {
    this.current = 0;
    this.target = 0;
  }

  update(dt, weatherDirector, phaseIntensity = 0) {
    const storm = weatherDirector?.activeStorm;
    this.target = storm ? Math.max(0, storm.stormSurge || 0) * phaseIntensity : 0;
    const response = 1 - Math.exp(-dt * (this.target > this.current ? 0.22 : 0.08));
    this.current += (this.target - this.current) * response;
    if (Math.abs(this.current) < 0.001 && this.target === 0) this.current = 0;
    return this.current;
  }

  serialize() {
    return { current: this.current, target: this.target };
  }

  hydrate(value = {}) {
    this.current = Number(value.current || 0);
    this.target = Number(value.target || 0);
  }
}
