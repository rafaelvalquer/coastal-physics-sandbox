import { FloodZone } from "./FloodZone.js";

const PX_PER_METER = 48;
const DEFAULT_ZONES = [
  { id: "coastal", name: "Avenida Costeira", minX: 600, maxX: 760, priority: "HIGH" },
  { id: "low-district", name: "Bairro Baixo", minX: 760, maxX: 900, priority: "HIGH" },
  { id: "center", name: "Centro", minX: 900, maxX: 1040, priority: "CRITICAL" },
  { id: "hills", name: "Encosta Segura", minX: 1040, maxX: 1275, priority: "SAFE" }
];

export class FloodZoneManager {
  constructor({ zones, water, buildings, eventBus }) {
    this.water = water;
    this.buildings = buildings;
    this.eventBus = eventBus;
    this.zones = (zones?.length ? zones : DEFAULT_ZONES).map((zone) => new FloodZone(zone));
    this.thresholds = new Set();
  }

  classify(depth) {
    if (depth >= 1.5) return "STRUCTURAL";
    if (depth >= 1) return "SEVERE";
    if (depth >= 0.5) return "BUILDINGS";
    if (depth >= 0.3) return "TRAFFIC";
    if (depth >= 0.15) return "FLOODED";
    if (depth >= 0.05) return "WET";
    return "DRY";
  }

  update(dt) {
    for (const zone of this.zones) {
      const first = Math.max(0, Math.floor(zone.minX / this.water.dx));
      const last = Math.min(this.water.n - 1, Math.ceil(zone.maxX / this.water.dx));
      let maxDepth = 0;
      let sumDepth = 0;
      let maxVelocity = 0;
      let samples = 0;

      for (let i = first; i <= last; i++) {
        const depth = this.water.h[i] / PX_PER_METER;
        const velocity = Math.abs(this.water.velocityAtIndex(i)) / PX_PER_METER;
        maxDepth = Math.max(maxDepth, depth);
        sumDepth += depth;
        maxVelocity = Math.max(maxVelocity, velocity);
        samples++;
      }

      zone.waterDepth = maxDepth;
      zone.averageDepth = samples ? sumDepth / samples : 0;
      zone.maxWaterDepth = Math.max(zone.maxWaterDepth, maxDepth);
      zone.floodVelocity = maxVelocity;
      if (maxDepth >= 0.05) zone.floodDuration += dt;
      zone.level = this.classify(maxDepth);
      zone.roadStatus = maxDepth >= 0.5 ? "BLOCKED" : maxDepth >= 0.3 ? "IMPAIRED" : "OPEN";

      let floodedBuildings = 0;
      let affected = 0;
      for (const building of this.buildings.list()) {
        if (building.x < zone.minX || building.x >= zone.maxX) continue;
        const index = Math.max(0, Math.min(this.water.n - 1, Math.floor(building.x / this.water.dx)));
        const depth = this.water.h[index] / PX_PER_METER;
        if (depth >= 0.15) {
          floodedBuildings++;
          affected += building.occupants || 0;
        }
      }
      zone.floodedBuildings = floodedBuildings;
      zone.populationAffected = affected;

      for (const threshold of [0.15, 0.3, 0.5, 1, 1.5]) {
        const key = zone.id + ":" + threshold;
        if (maxDepth >= threshold && !this.thresholds.has(key)) {
          this.thresholds.add(key);
          this.eventBus?.emit("flood:threshold", {
            zoneId: zone.id,
            zoneName: zone.name,
            depth: maxDepth,
            threshold,
            level: zone.level
          });
        }
      }
    }

    return this.snapshot();
  }

  snapshot() {
    return this.zones.map((zone) => zone.snapshot());
  }

  serialize() {
    return {
      zones: this.snapshot(),
      thresholds: [...this.thresholds]
    };
  }

  hydrate(value = {}) {
    if (Array.isArray(value.zones)) {
      for (const saved of value.zones) {
        const zone = this.zones.find((item) => item.id === saved.id);
        if (zone) Object.assign(zone, saved);
      }
    }
    this.thresholds = new Set(value.thresholds || []);
  }
}
