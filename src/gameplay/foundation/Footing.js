import { FoundationElement } from "./FoundationElement.js";
export class Footing extends FoundationElement {
  constructor(value={}) { super({type:"FOOTING",kind:"FOOTING",width:2,height:.5,mass:2500,baseWidthBonus:1.5,bearingMultiplier:1.2,...value}); }
}
