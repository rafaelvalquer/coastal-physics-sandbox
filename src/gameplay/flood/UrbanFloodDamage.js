export class UrbanFloodDamage {
  constructor({ floodZones, eventBus }) {
    this.floodZones = floodZones;
    this.eventBus = eventBus;
    this.lastSeverity = "DRY";
    this.affectedBuildings = 0;
    this.populationAffected = 0;
  }

  update() {
    const zones = this.floodZones.snapshot();
    this.affectedBuildings = zones.reduce((sum, zone) => sum + zone.floodedBuildings, 0);
    this.populationAffected = zones.reduce((sum, zone) => sum + zone.populationAffected, 0);

    const rank = ["DRY", "WET", "FLOODED", "TRAFFIC", "BUILDINGS", "SEVERE", "STRUCTURAL"];
    let severity = "DRY";
    for (const zone of zones) {
      if (rank.indexOf(zone.level) > rank.indexOf(severity)) severity = zone.level;
    }

    if (severity !== this.lastSeverity) {
      this.eventBus?.emit("city:flood-state", {
        previous: this.lastSeverity,
        severity,
        affectedBuildings: this.affectedBuildings,
        populationAffected: this.populationAffected
      });
      this.lastSeverity = severity;
    }

    return this.snapshot();
  }

  snapshot() {
    return {
      severity: this.lastSeverity,
      affectedBuildings: this.affectedBuildings,
      populationAffected: this.populationAffected
    };
  }
}
