export class EvacuationManager {
  constructor({ population, roads, eventBus }) {
    Object.assign(this, { population, roads, eventBus });
    this.order = "NONE";
    this.pending = [];
    this.progress = 0;
  }

  issue(type = "VOLUNTARY") {
    this.order = type;
    this.pending = this.population.households.filter((household) => !household.evacuated);
    this.progress = 0;
    const requested = this.pending.reduce((sum, household) => sum + household.members, 0);
    this.eventBus?.emit("evacuation:ordered", { type, requested });
    return requested;
  }

  issueBuilding(buildingId, type = "MANDATORY") {
    this.order = type;
    this.pending = this.population.households.filter(
      (household) => household.homeBuildingId === buildingId && !household.evacuated
    );
    this.progress = 0;
    const requested = this.pending.reduce((sum, household) => sum + household.members, 0);
    this.eventBus?.emit("evacuation:building-ordered", { type, buildingId, requested });
    return requested;
  }

  update(dt) {
    if (this.order === "NONE" || !this.pending.length) {
      for (const edge of this.roads.edges.values()) edge.volume = 0;
      return 0;
    }

    const path = this.roads.route("center", "hills");
    const edges = this.roads.pathEdges(path);
    if (!path.length || !edges.length) return 0;

    const waiting = this.pending.reduce((sum, household) => sum + household.members, 0);
    for (const edge of edges) edge.volume = waiting;

    const bottleneck = Math.min(...edges.map((edge) => {
      const speedFactor = edge.speedLimit ? this.roads.effectiveSpeed(edge) / edge.speedLimit : 0;
      return edge.capacity * Math.max(0, speedFactor);
    }));

    const urgency = this.order === "MANDATORY" ? 1.35 : 0.85;
    this.progress += Math.max(0, bottleneck) * urgency * dt / 60;

    let evacuatedNow = 0;
    while (this.pending.length && this.progress >= this.pending[0].members) {
      const household = this.pending.shift();
      this.progress -= household.members;
      household.evacuated = true;
      evacuatedNow += household.members;
      this.population.evacuated += household.members;
    }

    if (evacuatedNow) {
      this.eventBus?.emit("population:evacuated", {
        type: this.order,
        count: evacuatedNow,
        total: this.population.evacuated
      });
    }

    if (!this.pending.length) {
      for (const edge of edges) edge.volume = 0;
      this.order = "NONE";
    }

    return evacuatedNow;
  }

  clear() {
    this.order = "NONE";
    this.pending = [];
    this.progress = 0;
    for (const household of this.population.households) household.evacuated = false;
    for (const edge of this.roads.edges.values()) edge.volume = 0;
    this.population.evacuated = 0;
  }
}
