import { COASTAL_TOWN } from "./templates/CoastalTown.js";
import { HARBOR } from "./templates/Harbor.js";
import { LOW_LYING_CITY } from "./templates/LowLyingCity.js";
import { CLIFF_TOWN } from "./templates/CliffTown.js";
import { RIVER_MOUTH } from "./templates/RiverMouth.js";
import { EMPTY_SANDBOX } from "./templates/EmptySandbox.js";
import { PROCEDURAL_COAST } from "./templates/ProceduralCoast.js";

export const SCENARIO_TEMPLATES=[PROCEDURAL_COAST,COASTAL_TOWN,HARBOR,LOW_LYING_CITY,CLIFF_TOWN,RIVER_MOUTH,EMPTY_SANDBOX];

export class ScenarioSerializer{
 static list(){return SCENARIO_TEMPLATES.map(t=>t.serialize());}
 static get(id){return SCENARIO_TEMPLATES.find(t=>t.id===id)||PROCEDURAL_COAST;}
 static serialize(editor){return {template:editor.template?.id||"procedural-coast",roads:structuredClone(editor.roads||[]),spent:editor.spent,usedTools:[...editor.usedTools]};}
}
