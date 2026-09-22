import { ConstructionJob } from "./ConstructionJob.js";
export class ExcavationJob extends ConstructionJob {
  constructor(value={}){super({type:"EXCAVATE",...value});this.position=value.position||value.blueprint?.position||null;this.radius=Number(value.radius||value.blueprint?.radius||1);}
  serialize(){return {...super.serialize(),position:this.position,radius:this.radius};}
}
