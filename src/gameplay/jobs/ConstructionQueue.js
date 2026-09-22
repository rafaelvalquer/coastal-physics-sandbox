import { ConstructionJob } from "./ConstructionJob.js";import { RepairJob } from "./RepairJob.js";import { ReinforcementJob } from "./ReinforcementJob.js";import { DemolitionJob } from "./DemolitionJob.js";import { ExcavationJob } from "./ExcavationJob.js";
const PRIORITY={EMERGENCY:4,HIGH:3,NORMAL:2,LOW:1};
export class ConstructionQueue {
 constructor(){this.jobs=new Map();}
 add(job){this.jobs.set(job.id,job);return job;} get(id){return this.jobs.get(id);}
 active(){return [...this.jobs.values()].filter(j=>!["COMPLETED","CANCELLED","FAILED"].includes(j.state));}
 orderedActive(){return this.active().sort((a,b)=>(PRIORITY[b.priority]||0)-(PRIORITY[a.priority]||0)||a.createdAt-b.createdAt);}
 serialize(){return [...this.jobs.values()].map(j=>j.serialize());}
 hydrate(v=[]){this.jobs.clear();for(const raw of v){const C=raw.type==="REPAIR"?RepairJob:raw.type==="REINFORCE"?ReinforcementJob:ConstructionJob;const j=new C(raw);this.jobs.set(j.id,j);}}
}
