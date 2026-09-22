export class OverturningSolver {
  static solve(assembly, forces) {
    const bounds = assembly.bounds;
    if (!bounds) return { factor: 99, resistingMoment: 0, overturningMoment: 0, state: "SAFE" };

    const waveDirectionRight = forces.velocity >= 0;
    const pivotX = waveDirectionRight ? bounds.maxX : bounds.minX;
    const comDistanceMeters = Math.abs(assembly.centerOfMass.x - pivotX) / 48;
    const resistingMoment =
      Math.max(0, forces.weight - forces.buoyancy) * comDistanceMeters +
      forces.anchorMoment +
      forces.pileMoment;
    const overturningMoment = Math.max(1, forces.waveMoment);
    const factor = resistingMoment / overturningMoment;

    return {
      factor,
      resistingMoment,
      overturningMoment,
      pivotX,
      state: factor >= 1.5 ? "SAFE" : factor >= 1.2 ? "WARNING" : factor >= 1 ? "CRITICAL" : "FAILING"
    };
  }
}
