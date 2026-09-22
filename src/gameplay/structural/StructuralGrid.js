import { WORLD } from "../../engine/world/constants.js";
import { StructuralCell } from "./StructuralCell.js";

export class StructuralGrid {
  constructor({ cellMeters = 0.5, pixelsPerMeter = 48 } = {}) {
    this.cellMeters = cellMeters;
    this.cellSize = cellMeters * pixelsPerMeter;
    this.cols = Math.ceil(WORLD.width / this.cellSize);
    this.rows = Math.ceil(WORLD.height / this.cellSize);
    this.cells = new Map();
  }

  key(x, y) {
    return x + ":" + y;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  worldToCell(x, y) {
    return {
      x: Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize))),
      y: Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)))
    };
  }

  cellToWorld(x, y) {
    return {
      x: (x + 0.5) * this.cellSize,
      y: (y + 0.5) * this.cellSize
    };
  }

  snapWorld(x, y) {
    const cell = this.worldToCell(x, y);
    return { ...this.cellToWorld(cell.x, cell.y), gridX: cell.x, gridY: cell.y };
  }

  getCell(x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.cells.get(this.key(x, y)) || new StructuralCell({ x, y });
  }

  occupyBlock(block) {
    for (const cell of block.occupiedCells()) {
      if (!this.inBounds(cell.x, cell.y)) return false;
      const current = this.getCell(cell.x, cell.y);
      if (current.occupied && current.blockId !== block.id) return false;
    }
    for (const cell of block.occupiedCells()) {
      const current = this.getCell(cell.x, cell.y);
      current.blockId = block.id;
      this.cells.set(this.key(cell.x, cell.y), current);
    }
    return true;
  }

  occupyFoundation(element) {
    const cell = this.worldToCell(element.x, element.y);
    const current = this.getCell(cell.x, cell.y);
    current.foundationId = element.id;
    this.cells.set(this.key(cell.x, cell.y), current);
    return true;
  }

  releaseBlock(blockId) {
    for (const [key, cell] of this.cells) {
      if (cell.blockId === blockId) {
        cell.blockId = null;
        if (!cell.occupied) this.cells.delete(key);
      }
    }
  }

  isOccupied(x, y) {
    return Boolean(this.getCell(x, y)?.occupied);
  }

  neighbors(x, y) {
    return [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ]
      .filter(([nx, ny]) => this.inBounds(nx, ny))
      .map(([nx, ny]) => this.getCell(nx, ny));
  }

  serialize() {
    return {
      cellMeters: this.cellMeters,
      cells: [...this.cells.values()].map((cell) => cell.serialize())
    };
  }

  hydrate(value = {}) {
    this.cells.clear();
    for (const raw of value.cells || []) {
      const cell = new StructuralCell(raw);
      this.cells.set(this.key(cell.x, cell.y), cell);
    }
  }
}
