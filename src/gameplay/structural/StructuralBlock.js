import { STRUCTURAL_BLOCKS } from "../../data/structuralBlocks.js";

let sequence = 1;

export class StructuralBlock {
  constructor({
    id,
    type = "CONCRETE_BLOCK",
    gridX = 0,
    gridY = 0,
    integrity = 1,
    constructionState = "COMPLETED",
    progress = 1,
    rotation = 0,
    displacementX = 0,
    displacementY = 0,
    ...rest
  } = {}) {
    const config = STRUCTURAL_BLOCKS[type];
    if (!config) throw new Error("Unknown structural block: " + type);
    Object.assign(this, config, rest);
    this.id = id || "block-" + sequence++;
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.integrity = integrity;
    this.constructionState = constructionState;
    this.progress = progress;
    this.rotation = rotation;
    this.displacementX = displacementX;
    this.displacementY = displacementY;
    this.connected = rest.connected ?? true;
    this.anchored = rest.anchored ?? false;
    this.assemblyId = rest.assemblyId || null;
    this.mass = rest.mass || this.computeMass();
  }

  computeMass() {
    const volume = this.width * this.height * (this.thickness || 1);
    return volume * this.density;
  }

  occupiedCells() {
    const widthCells = Math.max(1, Math.round(this.width / 0.5));
    const heightCells = Math.max(1, Math.round(this.height / 0.5));
    const result = [];
    for (let dx = 0; dx < widthCells; dx++) {
      for (let dy = 0; dy < heightCells; dy++) {
        result.push({ x: this.gridX + dx, y: this.gridY - dy });
      }
    }
    return result;
  }

  worldCenter(grid) {
    const base = grid.cellToWorld(this.gridX, this.gridY);
    return {
      x: base.x + (this.width * 48 - grid.cellSize) / 2 + this.displacementX,
      y: base.y - (this.height * 48 - grid.cellSize) / 2 + this.displacementY
    };
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      gridX: this.gridX,
      gridY: this.gridY,
      integrity: this.integrity,
      constructionState: this.constructionState,
      progress: this.progress,
      rotation: this.rotation,
      displacementX: this.displacementX,
      displacementY: this.displacementY,
      connected: this.connected,
      buildingId: this.buildingId || null,
      debrisMaterial: this.debrisMaterial || null,
      anchored: this.anchored,
      assemblyId: this.assemblyId,
      mass: this.mass
    };
  }
}
