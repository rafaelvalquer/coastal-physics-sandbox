import { FoundationElement } from "./FoundationElement.js";
export class Pile extends FoundationElement {
  constructor(value={}) { super({type:value.type||"SHALLOW_PILE",kind:"PILE",depth:2.5,diameter:.25,axialCapacity:0,lateralCapacity:0,embeddedMaterial:"SOIL",...value}); }
}
