const PX_PER_METER = 48;

export class OffshoreWaveGenerator {
  constructor({ water, surfaceWaves, seaState, eventBus }) {
    this.water = water;
    this.surfaceWaves = surfaceWaves;
    this.seaState = seaState;
    this.eventBus = eventBus;
    this.phase = 0;
    this.previousSignal = 0;
    this.crestCount = 0;
  }

  update(dt) {
    const state = this.seaState.state;
    const period = Math.max(3.5, state.wavePeriod || 6.5);
    this.phase = (this.phase + dt * Math.PI * 2 / period) % (Math.PI * 2);

    const primary = Math.sin(this.phase);
    const secondary = Math.sin(this.phase * 1.91 + 0.8) * state.irregularity;
    const signal = Math.max(-1.25, Math.min(1.25, (primary + secondary) * state.groupIntensity));

    const amplitudePx = Math.min(
      32,
      Math.max(3.5, state.significantWaveHeight * PX_PER_METER * 0.27)
    );
    const orbitalVelocity = Math.min(
      72,
      8 + state.significantWaveHeight * 17 * state.groupIntensity
    );

    this.water.setOffshoreBoundary?.({
      waveAmplitudePx: amplitudePx,
      signal,
      phase: this.phase,
      currentVelocityPx: orbitalVelocity * Math.cos(this.phase),
      levelOffsetPx: 0
    });

    this.surfaceWaves.setBoundaryForcing?.({
      amplitudePx: Math.min(11, amplitudePx * 0.42),
      signal,
      intensity: state.groupIntensity
    });

    if (this.previousSignal <= 0 && signal > 0) {
      this.crestCount++;
      this.eventBus?.emit("sea:wave-crest", {
        crest: this.crestCount,
        height: state.significantWaveHeight * state.groupIntensity
      });
    }
    this.previousSignal = signal;
  }

  serialize() {
    return {
      phase: this.phase,
      previousSignal: this.previousSignal,
      crestCount: this.crestCount
    };
  }

  hydrate(value = {}) {
    this.phase = Number(value.phase || 0);
    this.previousSignal = Number(value.previousSignal || 0);
    this.crestCount = Number(value.crestCount || 0);
  }
}
