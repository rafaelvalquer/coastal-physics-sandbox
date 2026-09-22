import { WorkforcePool } from "./WorkforcePool.js";
export class WorkforceManager {
  constructor({population,eventBus,targetMunicipalWorkers=null}){this.population=population;this.eventBus=eventBus;this.targetMunicipalWorkers=targetMunicipalWorkers;this.pool=new WorkforcePool();this.workingAgeRatio=.42;this.municipalParticipation=.45;this.evacuatedWorkerPenalty=0;this.updateFromPopulation();}
  updateFromPopulation(){const p=this.population?.population||0,working=Math.floor(p*this.workingAgeRatio),derived=Math.floor(working*this.municipalParticipation),base=this.targetMunicipalWorkers==null?Math.max(8,derived):Math.min(working,this.targetMunicipalWorkers);const er=p?Math.min(1,(this.population?.evacuated||0)/p):0,hr=p?Math.min(1,(this.population?.homeless||0)/p):0;this.evacuatedWorkerPenalty=Math.floor(base*(er*.55+hr*.25));this.pool.total=Math.max(0,base-this.evacuatedWorkerPenalty);this.pool.essential=Math.min(6,Math.floor(this.pool.total*.25));this.pool.emergencyReserve=Math.min(4,Math.floor(this.pool.total*.16));return this.snapshot();}
  beginCycle(){this.updateFromPopulation();this.pool.beginCycle();}
  assign(id,n){return this.pool.assign(id,n);}
  snapshot(){return {population:this.population?.population||0,workingPopulation:Math.floor((this.population?.population||0)*this.workingAgeRatio),evacuatedWorkerPenalty:this.evacuatedWorkerPenalty,...this.pool.snapshot()};}
  serialize(){return {workingAgeRatio:this.workingAgeRatio,municipalParticipation:this.municipalParticipation,targetMunicipalWorkers:this.targetMunicipalWorkers};}
  hydrate(v={}){this.workingAgeRatio=Number(v.workingAgeRatio||this.workingAgeRatio);this.municipalParticipation=Number(v.municipalParticipation||this.municipalParticipation);this.targetMunicipalWorkers=v.targetMunicipalWorkers??this.targetMunicipalWorkers;this.updateFromPopulation();}
}
