const RHO_WATER = 1000;
const G = 9.81;
const PX_PER_METER = 48;

export class StructuralForces {
  static calculate(assembly, { water, foundation, fluidStructureCoupler = null }) {
    if (!assembly.bounds || !assembly.blocks.length) {
      return {
        horizontalForce: 0,
        verticalUplift: 0,
        waveMoment: 0,
        weight: 0,
        buoyancy: 0,
        frictionResistance: 0,
        anchorHorizontal: 0,
        anchorVertical: 0,
        pileHorizontal: 0,
        pileVertical: 0,
        waterDepth: 0,
        velocity: 0
      };
    }

    const sampleX = Math.max(0, assembly.bounds.minX - 4);
    const index = Math.max(0, Math.min(water.n - 1, Math.floor(sampleX / water.dx)));
    const depth = Math.max(0, water.h[index] / PX_PER_METER);
    const velocity = water.velocityAtIndex(index) / PX_PER_METER;
    const submergedHeight = Math.min(assembly.heightMeters, depth);
    const area = Math.max(0.25, submergedHeight);
    const hydrostatic = 0.5 * RHO_WATER * G * submergedHeight * submergedHeight;
    const dynamic = 0.5 * RHO_WATER * 1.8 * area * velocity * Math.abs(velocity);
    const coupledLoad = fluidStructureCoupler?.evaluate?.(
      assembly.id,
      sampleX,
      { heightMeters: assembly.heightMeters, widthMeters: Math.max(0.5, assembly.baseWidthMeters) }
    ) || null;
    const horizontalForce = coupledLoad
      ? Math.max(0, coupledLoad.horizontalForce)
      : Math.max(0, hydrostatic + Math.abs(dynamic));

    const submergedVolume = assembly.blocks.reduce((sum, block) => {
      const center = block.worldCenter(foundation.grid);
      const waterSurface = water.surfaceYAtX(center.x);
      const blockTop = center.y - block.height * PX_PER_METER / 2;
      const blockBottom = center.y + block.height * PX_PER_METER / 2;
      const submergedFraction = waterSurface >= blockBottom
        ? 0
        : waterSurface <= blockTop
          ? 1
          : Math.max(0, Math.min(1, (blockBottom - waterSurface) / (blockBottom - blockTop)));
      return sum + block.width * block.height * (block.thickness || 1) * submergedFraction;
    }, 0);

    const buoyancy = submergedVolume * RHO_WATER * G;
    const weight = assembly.totalMass * G;
    const baseMu = assembly.baseContacts.length
      ? assembly.baseContacts.reduce((sum, block) => sum + (block.friction || 0.6), 0) / assembly.baseContacts.length
      : 0.55;

    const foundationResistance = foundation.getResistanceForAssembly(assembly);
    const effectiveNormal = Math.max(0, weight - buoyancy);
    const frictionResistance = effectiveNormal * baseMu * foundationResistance.soilFactor;

    const leverArm = Math.max(0.15, submergedHeight / 3);
    const waveMoment = coupledLoad?.moment ?? (horizontalForce * leverArm);
    const verticalUplift = buoyancy + foundationResistance.underPressure + (coupledLoad?.uplift || 0);

    return {
      horizontalForce,
      verticalUplift,
      waveMoment,
      weight,
      buoyancy,
      frictionResistance,
      anchorHorizontal: foundationResistance.anchorHorizontal,
      anchorVertical: foundationResistance.anchorVertical,
      anchorMoment: foundationResistance.anchorMoment,
      pileHorizontal: foundationResistance.pileHorizontal,
      pileVertical: foundationResistance.pileVertical,
      pileMoment: foundationResistance.pileMoment,
      bearingCapacity: foundationResistance.bearingCapacity,
      underPressure: foundationResistance.underPressure,
      waterDepth: depth,
      velocity,
      peakPressure: coupledLoad?.peakPressure || (hydrostatic + Math.abs(dynamic)),
      slammingForce: coupledLoad?.slammingForce || 0,
      breaking: coupledLoad?.breaking || 0
    };
  }
}
