import { CONSTRUCTION_TYPES } from "../../data/constructions.js";
export class CoastalConstruction {
 constructor({id,type,x,y,length=10,condition=1,...rest}){ const cfg=CONSTRUCTION_TYPES[type]; if(!cfg)throw new Error("Unknown construction "+type); Object.assign(this,{id,type,x,y,length,condition,maintenanceDebt:0,foundationExposure:0,operational:true,...cfg,...rest}); this.cost=Math.round(cfg.costPerMeter*length); }
 serialize(){ return JSON.parse(JSON.stringify(this)); }
}
