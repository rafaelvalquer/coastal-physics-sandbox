export class RiemannSolver {
  static physicalFlux(state, g) {
    if (state.h <= 1e-8) return { mass: 0, momentum: 0 };
    return {
      mass: state.hu,
      momentum: state.hu * state.u + 0.5 * g * state.h * state.h
    };
  }

  static hll(left, right, g) {
    const fL = this.physicalFlux(left, g);
    const fR = this.physicalFlux(right, g);
    const cL = Math.sqrt(Math.max(0, g * left.h));
    const cR = Math.sqrt(Math.max(0, g * right.h));
    const sL = Math.min(left.u - cL, right.u - cR, 0);
    const sR = Math.max(left.u + cL, right.u + cR, 0);

    if (sL >= 0) return { ...fL, sL, sR };
    if (sR <= 0) return { ...fR, sL, sR };
    const den = Math.max(1e-9, sR - sL);
    return {
      mass: (sR * fL.mass - sL * fR.mass + sL * sR * (right.h - left.h)) / den,
      momentum: (sR * fL.momentum - sL * fR.momentum + sL * sR * (right.hu - left.hu)) / den,
      sL,
      sR
    };
  }
}
