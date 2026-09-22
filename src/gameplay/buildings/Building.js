import { BUILDING_TYPES } from "../../data/buildings.js";
export class Building {
  constructor({id,type,x,y,...overrides}){ const cfg=BUILDING_TYPES[type]; if(!cfg)throw new Error("Unknown building type "+type); Object.assign(this,{id,type,x,y,width:cfg.width,height:cfg.height,maxIntegrity:cfg.maxIntegrity,integrity:cfg.maxIntegrity,floodResistance:cfg.floodResistance,impactResistance:cfg.impactResistance,windResistance:cfg.windResistance,operational:true,constructionCost:cfg.constructionCost,maintenanceCost:cfg.maintenance,occupants:0,capacity:cfg.capacity,critical:Boolean(cfg.critical),connections:{},foundation:{depth:cfg.foundationDepth,supportArea:cfg.width,stability:1,settlement:0,erosionExposure:0,supportRatio:1},damageByCause:{}},overrides); }
  damage(amount,cause="UNKNOWN"){ const applied=Math.max(0,Number(amount)||0); this.integrity=Math.max(0,this.integrity-applied); this.damageByCause[cause]=(this.damageByCause[cause]||0)+applied; if(this.integrity<=0)this.operational=false; return applied; }
  repair(amount){ this.integrity=Math.min(this.maxIntegrity,this.integrity+Math.max(0,amount)); if(this.integrity>this.maxIntegrity*.3)this.operational=true; }
  get integrityRatio(){ return this.maxIntegrity?this.integrity/this.maxIntegrity:0; }
  serialize(){ return JSON.parse(JSON.stringify(this)); }
}
