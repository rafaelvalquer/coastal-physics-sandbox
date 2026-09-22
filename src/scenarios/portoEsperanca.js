import { ScenarioDefinition } from "./ScenarioDefinition.js";

export const PORTO_ESPERANCA = new ScenarioDefinition({
  id: "porto-esperanca",
  name: "Porto Esperança",
  seed: "PORTO_ESPERANCA_001",
  map: {
    physicalCells: [320, 180],
    zones: ["ocean", "beach", "coastal-road", "low-district", "center", "hills", "port"]
  },
  initialBalance: 100000,
  initialPopulation: 132,
  buildings: [
    ...Array.from({ length: 24 }, (_, i) => ({
      id: "house-" + (i + 1),
      type: "HOUSE",
      x: 650 + (i % 8) * 42,
      y: 330 + Math.floor(i / 8) * 45
    })),
    { id: "hospital", type: "HOSPITAL", x: 850, y: 300 },
    { id: "city-hall", type: "CITY_HALL", x: 930, y: 350 },
    { id: "power-plant", type: "POWER_PLANT", x: 1040, y: 390 },
    { id: "port", type: "PORT", x: 610, y: 500 }
  ],
  floodZones: [
    { id: "coastal", name: "Avenida Costeira", minX: 640, maxX: 760, priority: "HIGH" },
    { id: "low-district", name: "Bairro Baixo", minX: 760, maxX: 900, priority: "HIGH" },
    { id: "center", name: "Centro e Hospital", minX: 900, maxX: 1040, priority: "CRITICAL" },
    { id: "hills", name: "Encosta Segura", minX: 1040, maxX: 1275, priority: "SAFE" }
  ],
  coast: [
    { name: "Praia Norte", trend: "EROSION_MODERATE" },
    { name: "Praia Central", trend: "STABLE" },
    { name: "Praia Sul", trend: "DEPOSITION" }
  ],
  goals: {
    surviveYears: 10,
    minPopulationRatio: 0.8,
    criticalBuildings: ["city-hall", "hospital", "power-plant"]
  },
  tutorial: [
    "OBSERVE_SEA",
    "BUILD_40M_PROTECTION",
    "OPEN_FORECAST",
    "PREPARE_STORM",
    "REVIEW_DAMAGE",
    "REPAIR"
  ],
  onboarding: {
    calmDays: 1,
    firstMajorStormDay: 3,
    firstStormWaveHeight: 2.8,
    firstStormSurge: 0.8
  }
});
