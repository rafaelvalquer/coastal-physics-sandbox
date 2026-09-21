export class FoundationSystem {
  constructor({ terrain, water, eventBus }) {
    this.terrain = terrain;
    this.water = water;
    this.eventBus = eventBus;
  }

  sample(building) {
    const cellSize = this.terrain?.cellSize || 6;
    const samples = Math.max(3, Math.ceil(building.width / cellSize));
    const allowedDrop = Math.max(cellSize, building.foundation.depth * cellSize);
    let supported = 0;
    let moisture = 0;
    let integrity = 0;

    for (let i = 0; i < samples; i++) {
      const x = building.x - building.width / 2 + (i + 0.5) * building.width / samples;
      const column = this.terrain.worldToCell(x, building.y).x;
      const top = this.terrain.columnTopCell(column);
      if (top >= this.terrain.rows) continue;

      const topWorldY = top * cellSize;
      const foundationBaseY = building.y;
      const supportGap = Math.max(0, topWorldY - foundationBaseY);
      if (supportGap > allowedDrop) continue;

      supported++;
      const index = this.terrain.index(column, top);
      moisture += this.terrain.moisture[index] || 0;
      integrity += this.terrain.integrity[index] || 0;
    }

    const supportRatio = supported / samples;
    const averageMoisture = supported ? moisture / supported : 1;
    const compaction = supported ? integrity / supported : 0;
    const moistureFactor = Math.max(0.25, 1 - averageMoisture * 0.7);
    const bearingCapacity = Math.max(0, compaction * moistureFactor);
    const stability = Math.max(
      0,
      Math.min(1, supportRatio * 0.65 + bearingCapacity * 0.35)
    );

    return {
      supportRatio,
      averageMoisture,
      bearingCapacity,
      stability
    };
  }

  update(buildings, dt) {
    for (const building of buildings) {
      const sample = this.sample(building);
      building.foundation.supportRatio = sample.supportRatio;
      building.foundation.stability = sample.stability;
      building.foundation.erosionExposure = 1 - sample.supportRatio;

      if (sample.supportRatio < 0.8) {
        building.foundation.settlement += dt * (0.8 - sample.supportRatio) * 0.03;
      }
      if (sample.supportRatio < 0.4) {
        this.eventBus?.emit("foundation:collapse", {
          buildingId: building.id,
          supportRatio: sample.supportRatio
        });
      }
    }
  }
}
