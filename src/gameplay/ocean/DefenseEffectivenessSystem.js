const PX_PER_METER = 48;

export class DefenseEffectivenessSystem {
  constructor({ water, surfaceWaves, seaState, constructions }) {
    Object.assign(this, { water, surfaceWaves, seaState, constructions });
  }

  update() {
    const sea = this.seaState.state;
    for (const construction of this.constructions.list()) {
      const center = Math.max(0, Math.min(this.water.n - 1, Math.floor(construction.x / this.water.dx)));
      const upstream = Math.max(0, center - 8);
      const downstream = Math.min(this.water.n - 1, center + 8);

      const upstreamEnergy =
        Math.abs(this.water.q[upstream]) +
        Math.abs(this.surfaceWaves.displacement[upstream] || 0) * 45;
      const downstreamEnergy =
        Math.abs(this.water.q[downstream]) +
        Math.abs(this.surfaceWaves.displacement[downstream] || 0) * 45;

      const measuredReduction = upstreamEnergy > 1
        ? Math.max(0, Math.min(1, 1 - downstreamEnergy / upstreamEnergy))
        : Math.max(0, Math.min(1, construction.dissipation || 0));

      const remainingHeight = Math.max(
        0,
        (construction.height || 0) *
          (construction.condition ?? 1) *
          (1 - Math.min(0.65, (construction.foundationExposure || 0) * 0.4))
      );

      const stillWaterElevation = this.water.baseSeaElevation + sea.totalLevel * PX_PER_METER;
      const crestElevation = this.water.bed[center];
      const freeboard = (crestElevation - stillWaterElevation) / PX_PER_METER;
      const incoming = Math.max(0.2, sea.maximumWaveHeight || sea.significantWaveHeight || 0.4);
      const overtoppingRisk = Math.max(
        0,
        Math.min(1, (incoming - Math.max(0, freeboard) * 0.92) / incoming)
      );

      const effectiveness = {
        waveReduction: measuredReduction,
        overtoppingRisk,
        foundationRisk: Math.max(0, Math.min(1, construction.foundationExposure || 0)),
        condition: construction.condition ?? 1,
        remainingHeight,
        reflection: construction.reflectionCoefficient || 0,
        riskLabel: overtoppingRisk >= 0.72 ? "CRITICAL" : overtoppingRisk >= 0.4 ? "WARNING" : "SAFE"
      };

      construction.effectiveness = effectiveness;
    }
  }
}
