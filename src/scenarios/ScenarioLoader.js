import { PORTO_ESPERANCA } from "./portoEsperanca.js";
const SCENARIOS=new Map([[PORTO_ESPERANCA.id,PORTO_ESPERANCA]]);
export class ScenarioLoader { static load(id="porto-esperanca"){ const s=SCENARIOS.get(id); if(!s)throw new Error("Unknown scenario: "+id); return s; } static list(){ return [...SCENARIOS.values()]; } }
