import { createCoastalScenario } from "./scenarioFactory.js";

export const DELTA = createCoastalScenario({
  id: "delta",
  name: "Delta",
  seed: "DELTA_001",
  initialBalance: 115000,
  initialPopulation: 150,
  houseCount: 28,
  layout: { startX: 680, columns: 7, hospitalX: 900, cityHallX: 980 },
  coast: [
    { name: "Canal Norte", trend: "DEPOSITION_HIGH" },
    { name: "Margem Urbana", trend: "FLOOD_PRONE" },
    { name: "Canal Sul", trend: "EROSION_MODERATE" }
  ],
  surviveYears: 9,
  minPopulationRatio: 0.8
});
