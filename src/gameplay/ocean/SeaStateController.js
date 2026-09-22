import { WaveGroupGenerator } from "./WaveGroupGenerator.js";
import { StormSurgeSystem } from "./StormSurgeSystem.js";

export class SeaStateController {
  constructor({ weatherDirector, clock, random, eventBus }) {
    this.weatherDirector = weatherDirector;
    this.clock = clock;
    this.eventBus = eventBus;
    this.waveGroups = new WaveGroupGenerator(random);
    this.surge = new StormSurgeSystem();
    this.lastPhase = "CALM";
    this.state = {
      phase: "CALM",
      phaseProgress: 0,
      hoursToPeak: null,
      significantWaveHeight: 0.4,
      maximumWaveHeight: 0.65,
      wavePeriod: 6.5,
      direction: 90,
      groupIntensity: 1,
      irregularity: 0.16,
      tide: 0,
      stormSurge: 0,
      totalLevel: 0,
      energy: 0.05,
      visualWaveGain: 1.8
    };
  }

  phaseInfo() {
    const director = this.weatherDirector;
    const active = director.activeStorm;
    const next = director.nextStorm;

    if (!active) {
      if (next) {
        const hours = (new Date(next.startDate) - this.clock.getDate()) / 36e5;
        if (hours <= 72) {
          return { phase: "FORECAST", progress: Math.max(0, 1 - hours / 72), hoursToPeak: hours + (next.approachDuration || 0) };
        }
      }
      return { phase: "CALM", progress: 0, hoursToPeak: null };
    }

    const raw = director.phase;
    if (raw === "APPROACH") {
      const p = Math.max(0, Math.min(1, director.phaseHours / Math.max(0.01, active.approachDuration)));
      if (p < 0.58) return { phase: "APPROACH", progress: p / 0.58, hoursToPeak: Math.max(0, active.approachDuration - director.phaseHours) };
      return { phase: "BUILDUP", progress: (p - 0.58) / 0.42, hoursToPeak: Math.max(0, active.approachDuration - director.phaseHours) };
    }

    if (raw === "PEAK") {
      return { phase: "PEAK", progress: Math.min(1, director.phaseHours / Math.max(0.01, active.peakDuration)), hoursToPeak: 0 };
    }

    const p = Math.max(0, Math.min(1, director.phaseHours / Math.max(0.01, active.decayDuration)));
    if (p < 0.72) return { phase: "DECAY", progress: p / 0.72, hoursToPeak: 0 };
    return { phase: "RECOVERY", progress: (p - 0.72) / 0.28, hoursToPeak: 0 };
  }

  phaseIntensity(info) {
    if (info.phase === "CALM" || info.phase === "FORECAST") return 0;
    if (info.phase === "APPROACH") return 0.12 + info.progress * 0.38;
    if (info.phase === "BUILDUP") return 0.5 + info.progress * 0.5;
    if (info.phase === "PEAK") return 1;
    if (info.phase === "DECAY") return 1 - info.progress * 0.65;
    if (info.phase === "RECOVERY") return Math.max(0, 0.35 * (1 - info.progress));
    return 0;
  }

  update(dt) {
    const info = this.phaseInfo();
    const intensity = this.phaseIntensity(info);
    const active = this.weatherDirector.activeStorm;
    const groups = this.waveGroups.update(dt);

    const elapsedHours = this.clock.getElapsedDays() * 24;
    const astronomicalTide = 0.32 * Math.sin((elapsedHours / 12.42) * Math.PI * 2 - 0.6);
    const stormSurge = this.surge.update(dt, this.weatherDirector, intensity);

    const targetWave = active
      ? Math.max(1.2, active.targetWaveHeight || Math.min(4.2, 0.8 + (active.maxWindSpeed || 50) / 32))
      : 0.42;

    const significant = Math.max(0.25, 0.4 + (targetWave - 0.4) * intensity);
    const maximum = significant * (1.42 + 0.18 * Math.max(0, groups - 1));
    const period = 6.2 + intensity * 3.6;
    const gain = significant < 0.8 ? 1.8 : significant < 1.8 ? 1.55 : 1.18;

    this.state = {
      phase: info.phase,
      phaseProgress: info.progress,
      hoursToPeak: info.hoursToPeak,
      significantWaveHeight: significant,
      maximumWaveHeight: maximum,
      wavePeriod: period,
      direction: active?.direction || 90,
      groupIntensity: groups,
      irregularity: this.waveGroups.irregularity,
      tide: astronomicalTide,
      stormSurge,
      totalLevel: astronomicalTide + stormSurge,
      energy: Math.min(1, (significant * significant * period) / 55),
      visualWaveGain: gain
    };

    if (info.phase !== this.lastPhase) {
      const previous = this.lastPhase;
      this.lastPhase = info.phase;
      this.eventBus?.emit("sea:phase-changed", {
        previous,
        phase: info.phase,
        state: this.snapshot()
      });
    }

    return this.state;
  }

  snapshot() {
    return { ...this.state };
  }

  serialize() {
    return {
      state: this.state,
      lastPhase: this.lastPhase,
      waveGroups: this.waveGroups.serialize(),
      surge: this.surge.serialize()
    };
  }

  hydrate(value = {}) {
    if (value.state) this.state = { ...this.state, ...value.state };
    this.lastPhase = value.lastPhase || this.state.phase || "CALM";
    this.waveGroups.hydrate(value.waveGroups || {});
    this.surge.hydrate(value.surge || {});
  }
}
