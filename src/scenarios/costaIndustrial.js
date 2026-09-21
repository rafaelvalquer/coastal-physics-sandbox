import { createCoastalScenario } from "./scenarioFactory.js";

export const COSTA_INDUSTRIAL = createCoastalScenario({
  id: "costa-industrial",
  name: "Costa Industrial",
  seed: "COSTA_INDUSTRIAL_001",
  initialBalance: 135000,
  initialPopulation: 185,
  houseCount: 32,
  layout: { startX: 620, columns: 10, powerX: 1010, portX: 540 },
  coast: [
    { name: "Terminal Portuário", trend: "DEPOSITION" },
    { name: "Faixa Industrial", trend: "EROSION_MODERATE" }
  ],
  surviveYears: 10,
  minPopulationRatio: 0.78
});
