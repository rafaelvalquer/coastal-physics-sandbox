import { WeatherState } from "./WeatherState.js";
import { StormGenerator } from "./StormGenerator.js";
import { ForecastSystem } from "./ForecastSystem.js";

export class WeatherDirector {
  constructor({ random, eventBus, profile }) {
    this.random = random;
    this.eventBus = eventBus;
    this.profile = profile;
    this.state = new WeatherState({
      windSpeed: profile.baseWind,
      rainfall: profile.baseRain,
      tideOffset: profile.baseTide
    });
    this.generator = new StormGenerator(random);
    this.forecastSystem = new ForecastSystem(random);
    this.activeStorm = null;
    this.nextStorm = null;
    this.lastDay = -1;
    this.phase = "CALM";
    this.phaseHours = 0;
    this.forecastLeadHours = 48;
    this.forecastAnnounced = false;
  }

  schedule(date, overrides = {}) {
    this.nextStorm = Object.assign(this.generator.generate(date), overrides);
    this.forecastAnnounced = false;
    if (overrides.announceImmediately) {
      this.forecastAnnounced = true;
      this.eventBus?.emit("storm:forecast", {
        storm: this.nextStorm,
        forecast: this.forecastSystem.forecast(this.nextStorm, 3)
      });
    }
    return this.nextStorm;
  }

  start() {
    if (!this.nextStorm) return null;
    this.activeStorm = this.nextStorm;
    this.nextStorm = null;
    this.phase = "APPROACH";
    this.phaseHours = 0;
    this.eventBus?.emit("storm:started", { storm: this.activeStorm });
    return this.activeStorm;
  }

  update(dt, clock) {
    const day = Math.floor(clock.getElapsedDays());
    if (day !== this.lastDay) {
      this.lastDay = day;
      if (!this.activeStorm && !this.nextStorm && this.random.next() < this.profile.stormChancePerDay) {
        const date = new Date(clock.getDate().getTime() + this.random.range(48, 120) * 36e5);
        this.schedule(date);
      }
    }

    if (this.nextStorm && !this.activeStorm) {
      const startDate = new Date(this.nextStorm.startDate);
      const hours = (startDate - clock.getDate()) / 36e5;
      if (hours <= this.forecastLeadHours && hours > 0 && !this.forecastAnnounced) {
        this.forecastAnnounced = true;
        this.eventBus?.emit("storm:forecast", {
          storm: this.nextStorm,
          forecast: this.forecastSystem.forecast(this.nextStorm, Math.max(1, hours / 24))
        });
      }
      if (hours <= 0) this.start();
    }

    if (!this.activeStorm) {
      this.state.interpolate({
        windSpeed: this.profile.baseWind,
        rainfall: this.profile.baseRain,
        tideOffset: this.profile.baseTide,
        pressure: 1013,
        stormIntensity: 0
      }, dt * 0.08);
      return;
    }

    const storm = this.activeStorm;
    this.phaseHours += dt * clock.minutesPerRealSecond * clock.timeScale / 60;
    let factor = 0;

    if (this.phase === "APPROACH") {
      factor = Math.min(1, this.phaseHours / storm.approachDuration);
      if (factor >= 1) {
        this.phase = "PEAK";
        this.phaseHours = 0;
      }
    } else if (this.phase === "PEAK") {
      factor = 1;
      if (this.phaseHours >= storm.peakDuration) {
        this.phase = "DECAY";
        this.phaseHours = 0;
      }
    } else {
      factor = Math.max(0, 1 - this.phaseHours / storm.decayDuration);
      if (factor <= 0) {
        const ended = this.activeStorm;
        this.activeStorm = null;
        this.phase = "CALM";
        this.phaseHours = 0;
        this.eventBus?.emit("storm:ended", { storm: ended });
      }
    }

    if (this.activeStorm) {
      this.state.interpolate({
        windSpeed: this.profile.baseWind + (storm.maxWindSpeed - this.profile.baseWind) * factor,
        rainfall: this.profile.baseRain + storm.rainfallRate * factor,
        tideOffset: this.profile.baseTide + storm.stormSurge * factor,
        pressure: 1013 - 45 * factor,
        stormIntensity: factor,
        windDirection: storm.direction
      }, dt * 0.35);
    }
  }

  getForecast(days = 3) {
    if (this.nextStorm && this.forecastAnnounced) {
      return this.forecastSystem.forecast(this.nextStorm, days);
    }
    if (this.activeStorm) {
      return this.forecastSystem.forecast(this.activeStorm, Math.min(1, days));
    }
    return null;
  }

  serialize() {
    return {
      state: { ...this.state },
      activeStorm: this.activeStorm,
      nextStorm: this.nextStorm,
      phase: this.phase,
      phaseHours: this.phaseHours,
      lastDay: this.lastDay,
      forecastLeadHours: this.forecastLeadHours,
      forecastAnnounced: this.forecastAnnounced
    };
  }

  hydrate(value = {}) {
    this.state = new WeatherState(value.state || {});
    this.activeStorm = value.activeStorm || null;
    this.nextStorm = value.nextStorm || null;
    this.phase = value.phase || "CALM";
    this.phaseHours = Number(value.phaseHours || 0);
    this.lastDay = Number(value.lastDay ?? -1);
    this.forecastLeadHours = Number(value.forecastLeadHours || 48);
    this.forecastAnnounced = Boolean(value.forecastAnnounced);
  }
}
