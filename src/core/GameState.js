export class GameState {
  constructor() {
    this.status = "RUNNING";
    this.selectedTool = "INSPECT";
    this.selectedConstruction = null;
    this.selectedInspection = null;
    this.overlay = null;
    this.messages = [];
  }

  pushMessage(message, type = "info", meta = {}) {
    this.messages = [
      ...this.messages.slice(-39),
      { message, type, at: Date.now(), ...meta }
    ];
  }

  selectInspection(inspection) {
    this.selectedInspection = inspection || null;
  }

  serialize() {
    return { ...this };
  }

  hydrate(value = {}) {
    Object.assign(this, value);
  }
}
