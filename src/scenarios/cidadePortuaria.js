import { createCoastalScenario } from "./scenarioFactory.js";

export const CIDADE_PORTUARIA = createCoastalScenario({
  id: "cidade-portuaria",
  name: "Cidade Portuária",
  seed: "CIDADE_PORTUARIA_001",
  initialBalance: 160000,
  initialPopulation: 230,
  houseCount: 40,
  layout: { startX: 600, columns: 10, hospitalX: 920, cityHallX: 990, powerX: 1080, portX: 520 },
  coast: [
    { name: "Porto Velho", trend: "EROSION_HIGH" },
    { name: "Centro", trend: "FLOOD_PRONE" },
    { name: "Praia Sul", trend: "DEPOSITION" }
  ],
  surviveYears: 12,
  minPopulationRatio: 0.8
});
