import { PORTO_ESPERANCA } from "./portoEsperanca.js";
import { BAIA_DAS_DUNAS } from "./baiaDasDunas.js";
import { COSTA_INDUSTRIAL } from "./costaIndustrial.js";
import { DELTA } from "./delta.js";
import { CIDADE_PORTUARIA } from "./cidadePortuaria.js";

const ALL = [
  PORTO_ESPERANCA,
  BAIA_DAS_DUNAS,
  COSTA_INDUSTRIAL,
  DELTA,
  CIDADE_PORTUARIA
];

const SCENARIOS = new Map(ALL.map((scenario) => [scenario.id, scenario]));

export class ScenarioLoader {
  static load(id = "porto-esperanca") {
    const scenario = SCENARIOS.get(id);
    if (!scenario) throw new Error("Unknown scenario: " + id);
    return scenario;
  }

  static list() {
    return [...ALL];
  }
}
