export class HydrostaticReconstruction {
  static interface(left, right) {
    const z = Math.max(left.bed, right.bed);
    const etaL = left.bed + Math.max(0, left.h);
    const etaR = right.bed + Math.max(0, right.h);
    const hL = Math.max(0, etaL - z);
    const hR = Math.max(0, etaR - z);
    const uL = left.h > 1e-8 ? left.hu / left.h : 0;
    const uR = right.h > 1e-8 ? right.hu / right.h : 0;
    return {
      z,
      left: { h: hL, hu: hL * uL, u: uL, originalH: left.h },
      right: { h: hR, hu: hR * uR, u: uR, originalH: right.h }
    };
  }

  static momentumCorrection(g, originalH, reconstructedH) {
    return 0.5 * g * (originalH * originalH - reconstructedH * reconstructedH);
  }
}
