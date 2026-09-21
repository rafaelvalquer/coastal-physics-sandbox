import { ScenarioDefinition } from "./ScenarioDefinition.js";

function houses(count, startX = 650, startY = 330, columns = 8, dx = 42, dy = 45) {
  return Array.from({ length: count }, (_, i) => ({
    id: "house-" + (i + 1),
    type: "HOUSE",
    x: startX + (i % columns) * dx,
    y: startY + Math.floor(i / columns) * dy
  }));
}

export function createCoastalScenario({
  id,
  name,
  seed,
  initialBalance,
  initialPopulation,
  houseCount,
  layout = {},
  coast = [],
  surviveYears = 10,
  minPopulationRatio = 0.8,
  tutorial = []
}) {
  const startX = layout.startX ?? 650;
  const startY = layout.startY ?? 330;
  const columns = layout.columns ?? 8;

  return new ScenarioDefinition({
    id,
    name,
    seed,
    map: {
      physicalCells: [320, 180],
      zones: ["ocean", "beach", "dunes", "urban", "hills", "port"]
    },
    initialBalance,
    initialPopulation,
    buildings: [
      ...houses(houseCount, startX, startY, columns),
      { id: "hospital", type: "HOSPITAL", x: layout.hospitalX ?? 850, y: 300 },
      { id: "city-hall", type: "CITY_HALL", x: layout.cityHallX ?? 930, y: 350 },
      { id: "power-plant", type: "POWER_PLANT", x: layout.powerX ?? 1040, y: 390 },
      { id: "port", type: "PORT", x: layout.portX ?? 610, y: 500 }
    ],
    coast,
    goals: {
      surviveYears,
      minPopulationRatio,
      criticalBuildings: ["city-hall", "hospital", "power-plant"]
    },
    tutorial,
    onboarding: {
      calmYears: 1,
      firstMajorStormYear: 2
    }
  });
}
