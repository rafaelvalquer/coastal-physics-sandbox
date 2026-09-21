export class ConstructionTool {
  constructor({ constructionManager, preview }) {
    this.constructionManager = constructionManager;
    this.preview = preview;
    this.selectedType = null;
    this.length = 20;
  }

  select(type, length = 20) {
    this.selectedType = type;
    this.length = length;
  }

  clear() {
    this.selectedType = null;
  }

  inspect(position) {
    if (!this.selectedType) return null;
    return this.preview.inspect(this.selectedType, position, this.length);
  }

  place(position) {
    if (!this.selectedType) return { ok: false, reason: "Nenhuma construção selecionada" };
    return this.constructionManager.place({
      type: this.selectedType,
      x: position.x,
      y: position.y,
      length: this.length
    });
  }
}
