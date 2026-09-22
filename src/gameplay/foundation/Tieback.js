import { FoundationElement } from "./FoundationElement.js";
export class Tieback extends FoundationElement {
  constructor(value={}) { super({type:"TIEBACK",kind:"TIEBACK",length:6,angle:22,tensionCapacity:0,...value}); }
}
