export class Household {
  constructor({
    id,
    members = 4,
    homeBuildingId,
    employment = "MIXED",
    health = 1,
    evacuated = false,
    riskTolerance = 0.5
  }) {
    Object.assign(this, { id, members, homeBuildingId, employment, health, evacuated, riskTolerance });
  }
}
