const PX_PER_METER = 48;
const BARRIER_TYPES = new Set(["CONCRETE_WALL", "RIPRAP", "DUNE", "STRUCTURAL_ASSEMBLY"]);

export class OvertoppingSystem {
  constructor({ water, constructions, eventBus }) {
    this.water = water;
    this.constructions = constructions;
    this.eventBus = eventBus;
    this.records = new Map();
    this.totalDischarge = 0;
    this.activeCount = 0;
  }

  update(dt) {
    this.activeCount = 0;
    for (const construction of this.constructions.list()) {
      const operational = construction.type === "STRUCTURAL_ASSEMBLY"
        ? !construction.failed && construction.condition > 0.05
        : construction.operational;
      if (!operational || !BARRIER_TYPES.has(construction.type)) continue;

      const structural = construction.type === "STRUCTURAL_ASSEMBLY";
      const centerX = structural
        ? ((construction.bounds?.minX || 0) + (construction.bounds?.maxX || 0)) / 2
        : construction.x;
      const centerY = structural
        ? construction.bounds?.maxY || construction.centerOfMass?.y || 0
        : construction.y;
      const halfSpan = structural
        ? Math.max(8, ((construction.bounds?.maxX || centerX) - (construction.bounds?.minX || centerX)) / 2)
        : Math.max(8, Math.min(180, construction.length * 6));
      const center = Math.max(0, Math.min(this.water.n - 1, Math.floor(centerX / this.water.dx)));
      const landward = Math.max(0, Math.min(this.water.n - 1, Math.floor((centerX + halfSpan + 8) / this.water.dx)));

      const crestElevation = this.water.bed[center];
      const freeSurface = this.water.bed[center] + this.water.h[center];
      const headMeters = Math.max(0, (freeSurface - crestElevation) / PX_PER_METER);
      const landwardDepth = this.water.h[landward] / PX_PER_METER;
      const landwardVelocity = Math.max(0, this.water.velocityAtIndex(landward) / PX_PER_METER);
      const discharge = Math.max(
        0,
        landwardDepth * landwardVelocity + headMeters * headMeters * 0.45
      );

      const active = landwardDepth > 0.035 && (landwardVelocity > 0.02 || headMeters > 0.02);
      const record = this.records.get(construction.id) || {
        active: false,
        discharge: 0,
        accumulated: 0,
        severity: "NONE",
        lastEventAt: -999
      };

      record.active = active;
      record.discharge = discharge;
      if (active) {
        this.activeCount++;
        record.accumulated += discharge * dt;
        this.totalDischarge += discharge * dt;
      }

      record.severity = discharge > 0.45 ? "CRITICAL" : discharge > 0.12 ? "HIGH" : active ? "MODERATE" : "NONE";

      if (active && this.water.time - record.lastEventAt > 2.5) {
        record.lastEventAt = this.water.time;
        this.eventBus?.emit("coast:overtopping", {
          constructionId: construction.id,
          discharge,
          severity: record.severity,
          location: { x: centerX, y: centerY },
          landwardDepth
        });
      }

      this.records.set(construction.id, record);
      construction.overtopping = { ...record };
    }
  }

  snapshot() {
    return {
      activeCount: this.activeCount,
      totalDischarge: this.totalDischarge,
      records: Object.fromEntries([...this.records.entries()].map(([id, value]) => [id, { ...value }]))
    };
  }

  serialize() {
    return this.snapshot();
  }

  hydrate(value = {}) {
    this.totalDischarge = Number(value.totalDischarge || 0);
    this.records = new Map(Object.entries(value.records || {}));
  }
}
