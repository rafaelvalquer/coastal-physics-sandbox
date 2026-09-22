import { CenterOfMassSolver } from "./CenterOfMassSolver.js";

let sequence = 1;

export class StructuralAssembly {
  constructor({ id, blocks = [], foundationIds = [], anchorIds = [], condition = 1, rotation = 0, displacementX = 0 } = {}) {
    this.id = id || "assembly-" + sequence++;
    this.blocks = blocks;
    this.foundationIds = [...foundationIds];
    this.anchorIds = [...anchorIds];
    this.condition = condition;
    this.rotation = rotation;
    this.angularVelocity = 0;
    this.displacementX = displacementX;
    this.integrity = 1;
    this.stability = null;
    this.failed = false;
    this.failureMode = null;
    this.centerOfMass = { x: 0, y: 0 };
    this.bounds = null;
    this.totalMass = 0;
    this.baseContacts = [];
    this.waterContactArea = 0;
  }

  recalculate(grid, extraMasses = []) {
    const active = this.blocks.filter((block) => block.integrity > 0);
    const com = CenterOfMassSolver.solve(active, grid, extraMasses);
    this.centerOfMass = { x: com.x, y: com.y };
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
      integrity: this.integrity,
      failed: this.failed,
      failureMode: this.failureMode,
      stability: this.stability
    };
  }
}
