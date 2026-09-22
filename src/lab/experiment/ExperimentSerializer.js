import { ExperimentDefinition } from "./ExperimentDefinition.js";
export class ExperimentSerializer{
 static serialize(e){return JSON.stringify(e.serialize());}
 static parse(v){if(typeof v==="string")v=JSON.parse(v);return new ExperimentDefinition(v);}
 static code(e){const s=JSON.stringify(e.serialize());let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}const t=(h>>>0).toString(36).toUpperCase().padStart(8,"0");return "CP-"+t.slice(0,4)+"-"+t.slice(4,8);}
}
