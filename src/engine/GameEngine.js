import { WORLD, TOOLS } from './world/constants.js';
import { MATERIALS } from './world/materials.js';
import { TerrainGrid } from './world/TerrainGrid.js';
import { AtmosphereSystem } from './physics/AtmosphereSystem.js';
import { WaterSolver } from './physics/WaterSolver.js';
import { SurfaceWaveSolver } from './physics/SurfaceWaveSolver.js';
import { ErosionSystem } from './physics/ErosionSystem.js';
import { MoistureSystem } from './physics/MoistureSystem.js';
import { GranularSystem } from './physics/GranularSystem.js';
import { StructuralSystem } from './physics/StructuralSystem.js';
import { RigidBodySystem } from './physics/RigidBodySystem.js';
import { ParticleSystem } from './particles/ParticleSystem.js';
import { Renderer } from './rendering/Renderer.js';
import { clamp } from './utils/math.js';
import { Game } from '../core/Game.js';
import { WorldCamera } from '../gameplay/camera/WorldCamera.js';
import { CameraController } from '../gameplay/camera/CameraController.js';

export class GameEngine {
  constructor(canvas, onStats) {
    this.canvas = canvas;
    this.onStats = onStats;
    this.terrain = new TerrainGrid();
    this.particles = new ParticleSystem();
    this.atmosphere = new AtmosphereSystem();
    this.rigidBodies = new RigidBodySystem();
    this.water = new WaterSolver(this.terrain, this.atmosphere, this.particles);
    this.surfaceWaves = new SurfaceWaveSolver(this.water, this.atmosphere);
    this.erosion = new ErosionSystem(this.terrain, this.water, this.surfaceWaves, this.particles);
    this.moisture = new MoistureSystem(this.terrain, this.water, this.atmosphere);
    this.granular = new GranularSystem(this.terrain, this.particles);
    this.structural = new StructuralSystem(this.terrain, this.rigidBodies);
    this.camera = new WorldCamera({
      worldWidth: WORLD.width,
      worldHeight: WORLD.height,
      minZoom: 0.55,
      maxZoom: 2.5,
      zoom: 0.9
    });
    this.cameraController = new CameraController(this.camera);
    this.renderer = new Renderer(canvas, this);

    this.running = true;
    this.simulationSpeed = 1;
    this.simTime = 0;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.statsTimer = 0;
    this.tool = TOOLS.IMPULSE;
    this.brushSize = 2;
    this.pointer = { x: 0, y: 0, inside: false, down: false };
    this.keysDown = new Set();
    this.pointerMode = "tool";
    this.debug = { grid: false, velocity: false, pressure: false, sediment: false, moisture: false };
    this.game = new Game(this);
    this.destroyed = false;
    this.frameHandle = 0;

    this.spawnInitialDebris();
    this.bindInput();
    this.bindHotkeys();
    this.frameHandle = requestAnimationFrame((t) => this.frame(t));
  }

  bindInput() {
    this.handlers = {
      pointerdown: (event) => {
        this.canvas.setPointerCapture?.(event.pointerId);
        const wantsPan = event.button === 1 || this.keysDown.has("Space");
        if (wantsPan) {
          event.preventDefault();
          this.pointerMode = "pan";
          this.cameraController.startDrag(event.clientX, event.clientY);
          return;
        }

        const point = this.renderer.clientToWorld(event.clientX, event.clientY);
        Object.assign(this.pointer, point, { inside: true, down: true });
        this.pointerMode = "tool";
        this.applyTool(point.x, point.y, true);
      },
      pointermove: (event) => {
        if (this.pointerMode === "pan" && this.cameraController.dragging) {
          this.cameraController.dragTo(event.clientX, event.clientY, this.renderer.pixelRatio);
          return;
        }

        const point = this.renderer.clientToWorld(event.clientX, event.clientY);
        Object.assign(this.pointer, point, { inside: true });
        if (
          this.pointer.down &&
          this.tool !== TOOLS.IMPULSE &&
          this.tool !== TOOLS.DEBRIS &&
          this.tool !== TOOLS.INSPECT
        ) {
          this.applyTool(point.x, point.y, false);
        }
      },
      pointerup: () => {
        this.pointer.down = false;
        this.pointerMode = "tool";
        this.cameraController.endDrag();
      },
      pointercancel: () => {
        this.pointer.down = false;
        this.pointerMode = "tool";
        this.cameraController.endDrag();
      },
      pointerleave: () => {
        this.pointer.inside = false;
        this.pointer.down = false;
        if (this.pointerMode !== "pan") this.cameraController.endDrag();
      },
      wheel: (event) => {
        event.preventDefault();
        const point = this.renderer.clientToCanvas(event.clientX, event.clientY);
        const factor = Math.exp(-event.deltaY * 0.00125);
        this.camera.zoomBy(factor, point.x, point.y);
      },
      contextmenu: (event) => event.preventDefault()
    };

    for (const [name, handler] of Object.entries(this.handlers)) {
      this.canvas.addEventListener(name, handler, name === "wheel" ? { passive: false } : undefined);
    }
  }

  bindHotkeys() {
    this.keyHandler = (event) => {
      if (event.target?.matches?.("input, select, textarea")) return;
      this.keysDown.add(event.code);

      const match = /^F([1-9]|10|11)$/.exec(event.key);
      if (match) {
        event.preventDefault();
        this.game?.setOverlayByIndex(Number(match[1]) - 1);
        return;
      }

      if (event.code === "Home") {
        event.preventDefault();
        this.fitWorld();
      } else if (event.code === "Equal" || event.code === "NumpadAdd") {
        event.preventDefault();
        this.camera.zoomBy(1.12);
      } else if (event.code === "Minus" || event.code === "NumpadSubtract") {
        event.preventDefault();
        this.camera.zoomBy(1 / 1.12);
      } else if (event.code === "Escape") {
        this.game?.clearConstruction?.();
      }
    };

    this.keyUpHandler = (event) => {
      this.keysDown.delete(event.code);
    };

    window.addEventListener("keydown", this.keyHandler);
    window.addEventListener("keyup", this.keyUpHandler);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frameHandle);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.keyUpHandler) window.removeEventListener('keyup', this.keyUpHandler);
    for (const [name, handler] of Object.entries(this.handlers || {})) {
      this.canvas.removeEventListener(name, handler);
    }
    this.renderer.destroy();
  }

  frame(now) {
    if (this.destroyed) return;
    const realDt = clamp((now - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = now;
    this.fps += ((realDt > 0 ? 1 / realDt : 60) - this.fps) * 0.08;
    this.cameraController.update(realDt, this.keysDown);

    if (this.running) {
      this.accumulator += realDt * this.simulationSpeed;
      let steps = 0;
      while (this.accumulator >= WORLD.fixedDt && steps < 14) {
        this.step(WORLD.fixedDt);
        this.accumulator -= WORLD.fixedDt;
        steps++;
      }
      if (steps >= 14) this.accumulator = 0;
    }

    this.renderer.draw();
    this.statsTimer += realDt;
    if (this.statsTimer >= 0.18) {
      this.statsTimer = 0;
      this.onStats?.(this.getStats());
    }
    this.frameHandle = requestAnimationFrame((t) => this.frame(t));
  }

  step(dt) {
    this.simTime += dt;
    this.game?.update(dt);
    this.atmosphere.update(dt);
    this.water.update(dt);
    this.surfaceWaves.update(dt);
    this.erosion.update(dt);
    this.moisture.update(dt);
    this.granular.update(dt);
    this.structural.update(dt);
    this.rigidBodies.update(dt, this.water, this.terrain);
    this.particles.update(dt, this.water, this.terrain);
    this.game?.postPhysicsUpdate?.(dt);
  }

  spawnInitialDebris() {
    this.rigidBodies.spawn(535, 405, 24, 10, 620, 'wood');
    this.rigidBodies.spawn(610, 392, 18, 9, 720, 'wood');
  }

  applyTool(x, y, initialClick) {
    if (this.game?.state.selectedConstruction || this.game?.structuralEngineering?.planner?.selectedType) {
      if (initialClick) this.game.handleWorldClick(x, y);
      return;
    }
    if (this.tool === TOOLS.INSPECT) {
      if (initialClick) this.game?.handleWorldClick(x, y);
      return;
    }
    if (this.tool === TOOLS.IMPULSE) {
      if (!initialClick) return;
      this.water.addImpulse(x, -1.35);
      this.surfaceWaves.addImpulse(x, 1.9);
      this.particles.spawnSplash(x, this.water.surfaceYAtX(x), 1.6);
      return;
    }
    if (this.tool === TOOLS.DEBRIS) {
      if (!initialClick) return;
      this.rigidBodies.spawn(x, y, 16 + Math.random() * 15, 8 + Math.random() * 9, 580 + Math.random() * 230, 'wood');
      return;
    }

    const center = this.terrain.worldToCell(x, y);
    const r = this.brushSize;
    const materialByTool = {
      [TOOLS.SAND]: MATERIALS.SAND,
      [TOOLS.SOIL]: MATERIALS.SOIL,
      [TOOLS.ROCK]: MATERIALS.ROCK,
      [TOOLS.CONCRETE]: MATERIALS.CONCRETE
    };

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const cx = center.x + dx;
        const cy = center.y + dy;
        if (!this.terrain.inBounds(cx, cy)) continue;
        const idx = this.terrain.index(cx, cy);

        if (this.tool === TOOLS.DIG) {
          const old = this.terrain.getMaterial(cx, cy);
          if (old.solid) {
            this.terrain.setCell(cx, cy, MATERIALS.AIR.id, 0, 0);
            const wi = clamp(Math.floor(((cx + 0.5) * this.terrain.cellSize) / this.water.dx), 0, this.water.n - 1);
            if (old.key === 'SAND' || old.key === 'SOIL' || old.key === 'CLAY') this.water.sediment[wi] += 0.12;
          }
        } else {
          const mat = materialByTool[this.tool];
          if (mat && this.terrain.material[idx] === MATERIALS.AIR.id) {
            this.terrain.setCell(cx, cy, mat.id, 1, mat.key === 'SAND' ? 0.25 : 0.08);
          }
        }
      }
    }
  }

  setTool(tool) { this.tool = tool; }
  setBrushSize(size) { this.brushSize = clamp(Number(size), 1, 7); }
  setRunning(value) { this.running = Boolean(value); }
  setSimulationSpeed(value) { this.simulationSpeed = clamp(Number(value), 0.25, 8); }

  setEnvironment(partial) {
    if ('wind' in partial) this.atmosphere.wind = clamp(Number(partial.wind), -30, 30);
    if ('gustiness' in partial) this.atmosphere.gustiness = clamp(Number(partial.gustiness), 0, 1);
    if ('rain' in partial) this.atmosphere.rain = clamp(Number(partial.rain), 0, 120);
    if ('tide' in partial) this.atmosphere.tide = clamp(Number(partial.tide), -1.5, 2.2);
  }

  setDebug(key, value) {
    if (key in this.debug) this.debug[key] = Boolean(value);
  }

  focusOnWorld(x, y, zoom = this.camera.zoom) {
    this.camera.focusOn(x, y, zoom);
  }

  zoomCamera(factor) {
    return this.camera.zoomBy(factor);
  }

  fitWorld() {
    this.camera.fitWorld();
  }

  focusGameplay() {
    const buildings = this.game?.buildings?.list?.() || [];
    if (!buildings.length) {
      this.camera.fitWorld();
      return;
    }
    const xs = buildings.map((building) => building.x);
    const ys = buildings.map((building) => building.y - building.height / 2);
    this.camera.focusBounds({
      minX: Math.min(...xs, 80),
      maxX: Math.max(...xs),
      minY: Math.min(...ys, 250),
      maxY: Math.max(...ys, 560)
    }, 90);
  }

  focusCity() {
    const buildings = this.game?.buildings?.list?.() || [];
    if (!buildings.length) return this.focusGameplay();
    const xs = buildings.map((building) => building.x);
    const ys = buildings.map((building) => building.y - building.height / 2);
    this.camera.focusBounds({
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    }, 70);
  }

  focusCoast() {
    this.camera.focusBounds({ minX: 0, maxX: 900, minY: 300, maxY: 650 }, 70);
  }

  focusOnEntity(id, zoom = 1.65) {
    const building = this.game?.buildings?.get?.(id);
    if (building) {
      this.camera.focusOn(building.x, building.y - building.height / 2, zoom);
      this.game?.state?.selectInspection?.(
        this.inspectWorld(building.x, building.y - building.height / 2)
      );
      return true;
    }
    const construction = this.game?.constructions?.list?.().find((item) => item.id === id);
    if (construction) {
      this.camera.focusOn(construction.x, construction.y, zoom);
      return true;
    }
    return false;
  }

  triggerStormWave() {
    for (let x = 40; x < 360; x += 35) {
      this.water.addImpulse(x, 1.2 + (x / 360) * 0.9);
      this.surfaceWaves.addImpulse(x, -1.1);
    }
  }

  resetWorld(
    scenarioId = this.game?.scenario?.id || "porto-esperanca",
    difficulty = this.game?.difficulty?.level || "NORMAL"
  ) {
    this.terrain.generateIsland();
    this.water.refreshBed();
    this.water.resetWater();
    this.water.time = 0;
    this.surfaceWaves.displacement.fill(0);
    this.surfaceWaves.velocity.fill(0);
    this.surfaceWaves.time = 0;
    this.erosion.deposition.fill(0);
    this.erosion.totalSedimentReleased = 0;
    this.erosion.totalSedimentDeposited = 0;
    this.rigidBodies.bodies = [];
    this.particles.items = [];
    this.atmosphere.hydrate({ time: 0, wind: 8, gustiness: 0.28, rain: 0, tide: 0 });
    this.simTime = 0;
    this.game = new Game(this, scenarioId, difficulty);
    this.focusGameplay();
    this.spawnInitialDebris();
  }

  loadScenario(scenarioId, difficulty = "NORMAL") {
    this.resetWorld(scenarioId, difficulty);
    return this.game.snapshot();
  }

  inspectWorld(x, y) {
    const c = this.terrain.worldToCell(x, y);
    const idx = this.terrain.index(c.x, c.y);
    const wi = clamp(Math.floor(x / this.water.dx), 0, this.water.n - 1);
    const mat = this.terrain.getMaterial(c.x, c.y);
    return {
      x: Math.round(x),
      y: Math.round(y),
      material: mat.name,
      integrity: this.terrain.integrity[idx] || 0,
      moisture: this.terrain.moisture[idx] || 0,
      depth: this.water.h[wi] / 48,
      velocity: this.water.velocityAtIndex(wi) / 48,
      pressure: this.water.pressure[wi],
      sediment: this.water.sediment[wi],
      breaking: this.water.breaking[wi],
      building: this.game?.inspectAt?.(x, y) || null,
      construction: this.game?.inspectConstructionAt?.(x, y) || null
    };
  }

  getInspection() {
    if (!this.pointer.inside) return null;
    return this.inspectWorld(this.pointer.x, this.pointer.y);
  }

  getMiniMapData() {
    const step = Math.max(1, Math.floor(this.terrain.cols / 48));
    const coastline = [];
    for (let x = 0; x < this.terrain.cols; x += step) {
      coastline.push({
        x: (x + 0.5) * this.terrain.cellSize,
        y: this.terrain.columnTopCell(x) * this.terrain.cellSize
      });
    }
    return {
      worldWidth: WORLD.width,
      worldHeight: WORLD.height,
      coastline,
      buildings: (this.game?.buildings?.list?.() || []).map((building) => ({
        id: building.id,
        type: building.type,
        x: building.x,
        y: building.y,
        critical: ["HOSPITAL", "CITY_HALL", "POWER_PLANT", "PORT"].includes(building.type)
      })),
      constructions: (this.game?.constructions?.list?.() || []).map((item) => ({
        id: item.id,
        type: item.type,
        x: item.x,
        y: item.y
      }))
    };
  }

  getStats() {
    let sediment = 0;
    for (let i = 0; i < this.water.n; i++) sediment += this.water.sediment[i];
    return {
      fps: this.fps,
      simTime: this.simTime,
      waterVolume: this.water.totalVolume,
      kineticEnergy: this.water.kineticEnergy,
      waveEnergy: this.water.waveEnergy,
      sediment,
      erodedCells: this.terrain.erodedCells,
      bodies: this.rigidBodies.bodies.length,
      particles: this.particles.items.length,
      inspection: this.getInspection(),
      camera: this.camera.snapshot(),
      minimap: this.getMiniMapData(),
      gameplay: this.game?.snapshot?.() || null
    };
  }

  serialize() {
    return {
      version: 2,
      saveVersion: 1,
      simTime: this.simTime,
      simulationSpeed: this.simulationSpeed,
      terrain: this.terrain.serialize(),
      atmosphere: this.atmosphere.serialize(),
      water: this.water.serialize(),
      surfaceWaves: this.surfaceWaves.serialize(),
      erosion: this.erosion.serialize(),
      rigidBodies: this.rigidBodies.serialize(),
      particles: this.particles.serialize(),
      camera: this.camera.serialize(),
      gameplay: this.game?.serialize?.() || null
    };
  }

  hydrate(state) {
    if (!state) return;
    this.terrain.hydrate(state.terrain);
    this.atmosphere.hydrate(state.atmosphere);
    this.water.hydrate(state.water);
    this.surfaceWaves.hydrate(state.surfaceWaves);
    this.erosion.hydrate(state.erosion);
    this.rigidBodies.hydrate(state.rigidBodies);
    this.particles.hydrate(state.particles);
    this.camera.hydrate(state.camera || {});
    const scenarioId = state.gameplay?.scenarioId || this.game?.scenario?.id || "porto-esperanca";
    const difficulty = state.gameplay?.difficulty?.level || this.game?.difficulty?.level || "NORMAL";
    if (this.game?.scenario?.id !== scenarioId || this.game?.difficulty?.level !== difficulty) {
      this.game = new Game(this, scenarioId, difficulty);
    }
    this.game?.hydrate?.(state.gameplay || {});
    this.simTime = Number(state.simTime || 0);
    this.simulationSpeed = clamp(Number(state.simulationSpeed || 1), 0.25, 8);
  }
}
