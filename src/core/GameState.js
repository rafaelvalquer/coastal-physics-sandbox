export class GameState {
  constructor(){ this.status="RUNNING"; this.selectedTool="INSPECT"; this.selectedConstruction=null; this.overlay=null; this.messages=[]; }
  pushMessage(message,type="info"){ this.messages=[...this.messages.slice(-19),{message,type,at:Date.now()}]; }
  serialize(){ return {...this}; }
  hydrate(v={}){ Object.assign(this,v); }
}
