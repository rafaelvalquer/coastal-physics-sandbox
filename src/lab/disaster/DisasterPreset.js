import { DisasterDefinition } from "./DisasterDefinition.js";
export class DisasterPreset{constructor({id,name,description,disaster}){this.id=id;this.name=name;this.description=description;this.disaster=new DisasterDefinition(disaster);}create(){return new DisasterDefinition(this.disaster.serialize());}}
