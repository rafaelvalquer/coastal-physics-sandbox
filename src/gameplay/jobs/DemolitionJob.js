import { ConstructionJob } from "./ConstructionJob.js";
export class DemolitionJob extends ConstructionJob {
  constructor(value={}){super({type:"DEMOLISH",...value});this.targetId=value.targetId||value.blueprint?.targetId||null;}
  serialize(){return {...super.serialize(),targetId:this.targetId};}
}
