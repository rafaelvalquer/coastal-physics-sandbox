import { ConstructionJob } from "./ConstructionJob.js";
export class RepairJob extends ConstructionJob {constructor(v={}){super({type:"REPAIR",...v});this.targetId=v.targetId||v.blueprint?.targetId||null;this.restoreAmount=Number(v.restoreAmount||.25);}serialize(){return {...super.serialize(),targetId:this.targetId,restoreAmount:this.restoreAmount};}}
