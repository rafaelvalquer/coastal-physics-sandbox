import { FoundationElement } from "./FoundationElement.js";
export class RockAnchor extends FoundationElement {
  constructor(value={}) { super({type:"ROCK_ANCHOR",kind:"ANCHOR",length:5,angle:32,tensionCapacity:0,rockBondStrength:0,...value}); }
}
