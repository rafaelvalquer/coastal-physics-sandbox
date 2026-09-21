import { createCoastalScenario } from "./scenarioFactory.js";

export const BAIA_DAS_DUNAS = createCoastalScenario({
  id: "baia-das-dunas",
  name: "Baía das Dunas",
  seed: "BAIA_DAS_DUNAS_001",
  initialBalance: 85000,
  initialPopulation: 105,
  houseCount: 21,
  layout: { startX: 700, columns: 7, portX: 560 },
  coast: [
    { name: "Dunas Oeste", trend: "EROSION_HIGH" },
    { name: "Baía Central", trend: "STABLE" },
    { name: "Dunas Leste", trend: "EROSION_MODERATE" }
  ],
  surviveYears: 8,
  minPopulationRatio: 0.82,
  tutorial: ["INSPECT_COAST", "BUILD_20M_PROTECTION", "OPEN_FORECAST", "PREPARE_STORM"]
});
