import { WORLD } from './constants.js';
import { MATERIALS, MATERIAL_BY_ID } from './materials.js';
import { clamp, smoothNoise1D, smoothstep } from '../utils/math.js';

export class TerrainGrid {
  constructor() {
    this.cellSize = WORLD.terrainCell;
    this.cols = Math.ceil(WORLD.width / this.cellSize);
    this.rows = Math.ceil(WORLD.height / this.cellSize);
    const count = this.cols * this.rows;
    this.material = new Uint8Array(count);
    this.integrity = new Float32Array(count);
    this.moisture = new Float32Array(count);
    this.vegetation = new Float32Array(count);
    this.rootStrength = new Float32Array(count);
    this.age = new Float32Array(count);
    this.erodedCells = 0;
    this.generateIsland();
  }

  index(x, y) {
    return y * this.cols + x;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  getMaterialId(x, y) {
    if (!this.inBounds(x, y)) return MATERIALS.AIR.id;
    return this.material[this.index(x, y)];
  }

  getMaterial(x, y) {
    return MATERIAL_BY_ID[this.getMaterialId(x, y)] || MATERIALS.AIR;
  }

  isSolid(x, y) {
    return this.getMaterial(x, y).solid;
  }

  setCell(x, y, materialId, integrity = 1, moisture = 0) {
    if (!this.inBounds(x, y)) return;
    const idx = this.index(x, y);
    this.material[idx] = materialId;
    this.integrity[idx] = materialId === MATERIALS.AIR.id ? 0 : clamp(integrity, 0, 1);
    this.moisture[idx] = materialId === MATERIALS.AIR.id ? 0 : clamp(moisture, 0, 1);
    if (materialId === MATERIALS.AIR.id) {
      this.vegetation[idx] = 0;
      this.rootStrength[idx] = 0;
    }
    this.age[idx] = 0;
  }

  damageCell(x, y, amount) {
    if (!this.inBounds(x, y)) return { removed: false, material: MATERIALS.AIR };
    const idx = this.index(x, y);
    const mat = MATERIAL_BY_ID[this.material[idx]] || MATERIALS.AIR;
    if (!mat.solid || amount <= 0) return { removed: false, material: mat };
    this.integrity[idx] -= amount;
    if (this.integrity[idx] <= 0) {
      this.material[idx] = MATERIALS.AIR.id;
      this.integrity[idx] = 0;
      this.moisture[idx] = 0;
      this.erodedCells++;
      return { removed: true, material: mat };
    }
    return { removed: false, material: mat };
  }

  worldToCell(x, y) {
    return {
      x: clamp(Math.floor(x / this.cellSize), 0, this.cols - 1),
      y: clamp(Math.floor(y / this.cellSize), 0, this.rows - 1)
    };
  }

  columnTopCell(col) {
    col = clamp(col, 0, this.cols - 1);
    for (let y = 0; y < this.rows; y++) {
      if (this.isSolid(col, y)) return y;
    }
    return this.rows;
  }

  columnTopWorldYAt(worldX) {
    const col = clamp(Math.floor(worldX / this.cellSize), 0, this.cols - 1);
    return this.columnTopCell(col) * this.cellSize;
  }

  surfaceCellForWorldX(worldX) {
    const col = clamp(Math.floor(worldX / this.cellSize), 0, this.cols - 1);
    return { x: col, y: this.columnTopCell(col) };
  }

  generateIsland() {
    this.material.fill(MATERIALS.AIR.id);
    this.integrity.fill(0);
    this.moisture.fill(0);
    this.vegetation.fill(0);
    this.rootStrength.fill(0);

    for (let x = 0; x < this.cols; x++) {
      const nx = x / (this.cols - 1);
      const worldX = x * this.cellSize;
      const noise = smoothNoise1D(nx * 7.5, 814) * 10 + smoothNoise1D(nx * 19, 91) * 4;

      let topY = 620 + noise;
      const beachRise = smoothstep(0.48, 0.67, nx);
      const islandFall = smoothstep(0.91, 1.0, nx);
      const hill = Math.exp(-Math.pow((nx - 0.76) / 0.16, 2));
      topY -= beachRise * 155;
      topY -= hill * 175;
      topY += islandFall * 90;
      topY = clamp(topY, 210, 650);

      const topRow = clamp(Math.floor(topY / this.cellSize), 0, this.rows - 1);
      for (let y = topRow; y < this.rows; y++) {
        const depth = y - topRow;
        let mat = MATERIALS.ROCK;
        if (depth <= 2) {
          if (worldX < WORLD.width * 0.66) mat = MATERIALS.SAND;
          else mat = nx > 0.69 && nx < 0.91 ? MATERIALS.SOIL : MATERIALS.SAND;
        } else if (depth <= 6) {
          mat = nx > 0.68 && nx < 0.9 ? MATERIALS.CLAY : MATERIALS.GRAVEL;
        } else if (depth <= 10 && nx > 0.67) {
          mat = MATERIALS.SOIL;
        }
        this.setCell(x, y, mat.id, 1, nx < 0.63 ? 0.7 : 0.18);
      }
    }

    // Pequeno afloramento rochoso na zona de arrebentação.
    const rx = Math.floor(this.cols * 0.56);
    for (let dx = -3; dx <= 4; dx++) {
      const top = this.columnTopCell(rx + dx);
      for (let dy = 0; dy < 3 - Math.floor(Math.abs(dx) * 0.3); dy++) {
        this.setCell(rx + dx, top - 1 - dy, MATERIALS.ROCK.id, 1, 0.05);
      }
    }
  }

  serialize() {
    return {
      material: Array.from(this.material),
      integrity: Array.from(this.integrity),
      moisture: Array.from(this.moisture),
      vegetation: Array.from(this.vegetation),
      rootStrength: Array.from(this.rootStrength),
      erodedCells: this.erodedCells
    };
  }

  hydrate(data) {
    if (!data) return;
    if (data.material?.length === this.material.length) this.material.set(data.material);
    if (data.integrity?.length === this.integrity.length) this.integrity.set(data.integrity);
    if (data.moisture?.length === this.moisture.length) this.moisture.set(data.moisture);
    if (data.vegetation?.length === this.vegetation.length) this.vegetation.set(data.vegetation);
    if (data.rootStrength?.length === this.rootStrength.length) this.rootStrength.set(data.rootStrength);
    this.erodedCells = Number(data.erodedCells || 0);
  }
}
