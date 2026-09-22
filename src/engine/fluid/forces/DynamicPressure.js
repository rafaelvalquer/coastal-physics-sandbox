const RHO_WATER = 1000;
export class DynamicPressure {
  static calculate(velocityMeters, cd = 1.2, rho = RHO_WATER) {
    return 0.5 * rho * cd * velocityMeters * Math.abs(velocityMeters);
  }
}
