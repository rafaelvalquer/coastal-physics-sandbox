import { ConstructionJob } from "./ConstructionJob.js";
export class ReinforcementJob extends ConstructionJob {constructor(v={}){super({type:"REINFORCE",...v});this.targetAssemblyId=v.targetAssemblyId||v.blueprint?.targetAssemblyId||null;}serialize(){return {...super.serialize(),targetAssemblyId:this.targetAssemblyId};}}
