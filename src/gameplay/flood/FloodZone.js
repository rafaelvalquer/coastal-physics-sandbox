export class FloodZone {
  constructor({ id, name, minX, maxX, priority = "NORMAL" }) {
    Object.assign(this, { id, name, minX, maxX, priority });
    this.waterDepth = 0;
    this.averageDepth = 0;
    this.maxWaterDepth = 0;
    this.floodDuration = 0;
    this.floodVelocity = 0;
    this.floodedBuildings = 0;
    this.populationAffected = 0;
    this.roadStatus = "OPEN";
    this.level = "DRY";
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      minX: this.minX,
      maxX: this.maxX,
      priority: this.priority,
      waterDepth: this.waterDepth,
      averageDepth: this.averageDepth,
      maxWaterDepth: this.maxWaterDepth,
      floodDuration: this.floodDuration,
      floodVelocity: this.floodVelocity,
      floodedBuildings: this.floodedBuildings,
      populationAffected: this.populationAffected,
      roadStatus: this.roadStatus,
      level: this.level
    };
  }
}
