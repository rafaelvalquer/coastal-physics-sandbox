export class StructuralCell {
  constructor({ x, y, blockId = null, foundationId = null } = {}) {
    this.x = x;
    this.y = y;
    this.blockId = blockId;
    this.foundationId = foundationId;
  }

  get occupied() {
    return Boolean(this.blockId || this.foundationId);
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      blockId: this.blockId,
      foundationId: this.foundationId
    };
  }
}
