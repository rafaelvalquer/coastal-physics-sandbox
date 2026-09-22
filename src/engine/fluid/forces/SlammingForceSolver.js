const RHO_WATER = 1000;
export class SlammingForceSolver {
  static solve({ relativeVelocity = 0, area = 1, coefficient = 2.2, duration = 0.08, rho = RHO_WATER } = {}) {
    const v = Math.abs(relativeVelocity);
    const peakPressure = 0.5 * rho * coefficient * v * v;
    const force = peakPressure * Math.max(0, area);
    const impulse = force * Math.max(0.01, duration);
    return { peakPressure, force, impulse, duration };
  }
}
