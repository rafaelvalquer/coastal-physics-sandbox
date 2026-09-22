import { DisasterDefinition } from "../disaster/DisasterDefinition.js";
let sequence=1;
export class ExperimentDefinition{
 constructor(v={}){this.id=v.id||"experiment-"+sequence++;this.name=v.name||"Novo experimento";this.mode=v.mode||"SANDBOX";this.map={template:v.map?.template||"coastal-town",seed:v.map?.seed??48212};this.disaster=v.disaster instanceof DisasterDefinition?v.disaster:new DisasterDefinition(v.disaster||{});this.environment={soilSaturation:v.environment?.soilSaturation??.35,seaLevelOffset:v.environment?.seaLevelOffset??0,vegetationWetness:v.environment?.vegetationWetness??.5};this.structures=structuredClone(v.structures||[]);this.buildings=structuredClone(v.buildings||[]);this.constraints=v.constraints?structuredClone(v.constraints):null;this.metadata=structuredClone(v.metadata||{});}
 clone(){return new ExperimentDefinition(this.serialize());}
 serialize(){return {id:this.id,name:this.name,mode:this.mode,map:{...this.map},disaster:this.disaster.serialize(),environment:{...this.environment},structures:structuredClone(this.structures),buildings:structuredClone(this.buildings),constraints:this.constraints?structuredClone(this.constraints):null,metadata:structuredClone(this.metadata)};}
}
