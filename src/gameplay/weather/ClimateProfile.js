import { CLIMATE_PROFILE } from "../../data/weather.js";

export class ClimateProfile {
  constructor(values = {}) {
    Object.assign(this, CLIMATE_PROFILE, values);
  }
}
