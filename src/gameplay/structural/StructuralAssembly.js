import { CenterOfMassSolver } from "./CenterOfMassSolver.js";

let sequence = 1;

export class StructuralAssembly {
  constructor({ id, blocks = [], foundationIds = [], anchorIds = [], condition = 1, rotation = 0, displacementX = 0, displacementY = 0, velocityX = 0, velocityY = 0 } = {}) {
    this.id = id || "assembly-" + sequence++;
    this.type = "STRUCTURAL_ASSEMBLY";
    this.blocks = blocks;
    this.foundationIds = [...foundationIds];
    this.anchorIds = [...anchorIds];
    this.condition = condition;
    this.rotation = rotation;
    this.angularVelocity = 0;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.displacementX = displacementX;
    this.displacementY = displacementY;
    this.integrity = 1;
    this.stability = null;
    this.failed = false;
    this.failureMode = null;
    this.centerOfMass = { x: 0, y: 0 };
    this.bounds = null;
    this.totalMass = 0;
    this.baseContacts = [];
    this.waterContactArea = 0;
    this.collapseState = "STABLE";
    this.failureElapsed = 0;
    this.fractured = false;
    this.buildingId = null;
    this.restCenter = null;
  }

  recalculate(grid, extraMasses = []) {
    const active = this.blocks.filter((block) => block.integrity > 0);
    const com = CenterOfMassSolver.solve(active, grid, extraMasses);
    this.centerOfMass = { x: com.x, y: com.y };
    if (!this.restCenter) this.restCenter = { x: com.x, y: com.y };
    this.totalMass = com.totalMass;

    if (!active.length) {
      this.bounds = null;
      this.baseContacts = [];
      return this;
    }

    const centers = active.map((block) => ({ block, ...block.worldCenter(grid) }));
    this.bounds = {
      minX: Math.min(...centers.map((entry) => entry.x - entry.block.width * 24)),
      maxX: Math.max(...centers.map((entry) => entry.x + entry.block.width * 24)),
      minY: Math.min(...centers.map((entry) => entry.y - entry.block.height * 24)),
      maxY: Math.max(...centers.map((entry) => entry.y + entry.block.height * 24))
    };

    const maxGridY = Math.max(...active.map((block) => block.gridY));
    this.baseContacts = active.filter((block) => block.gridY === maxGridY);
    this.integrity = active.reduce((sum, block) => sum + block.integrity, 0) / active.length;
    return this;
  }

  get baseWidthMeters() {
    if (!this.bounds) return 0;
    return Math.max(0.5, (this.bounds.maxX - this.bounds.minX) / 48);
  }

  get heightMeters() {
    if (!this.bounds) return 0;
    return Math.max(0.5, (this.bounds.maxY - this.bounds.minY) / 48);
  }

  serialize() {
    return {
      id: this.id,
      blockIds: this.blocks.map((block) => block.id),
      foundationIds: this.foundationIds,
      anchorIds: this.anchorIds,
      condition: this.condition,
      rotation: this.rotation,
      displacementX: this.displacementX,
      displacementY: this.displacementY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      angularVelocity: this.angularVelocity,
      integrity: this.integrity,
      failed: this.failed,
      failureMode: this.failureMode,
      collapseState: this.collapseState,
      failureElapsed: this.failureElapsed,
      fractured: this.fractured,
      buildingId: this.buildingId,
      restCenter: this.restCenter,
      stability: this.stability
    };
  }
}
