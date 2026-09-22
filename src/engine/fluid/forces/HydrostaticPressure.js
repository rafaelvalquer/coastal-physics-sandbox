const RHO_WATER = 1000;
const G = 9.81;
export class HydrostaticPressure {
  static atDepth(depthMeters, rho = RHO_WATER) {
    return Math.max(0, rho * G * depthMeters);
  }

  static resultant(depthMeters, widthMeters = 1, rho = RHO_WATER) {
    const h = Math.max(0, depthMeters);
    const force = 0.5 * rho * G * h * h * widthMeters;
    return { force, centerOfPressure: h / 3, maxPressure: rho * G * h };
  }
}
