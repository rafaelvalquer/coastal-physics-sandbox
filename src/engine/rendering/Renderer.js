import { WORLD } from '../world/constants.js';
import { MATERIAL_BY_ID, MATERIALS } from '../world/materials.js';
import { clamp } from '../utils/math.js';

export class Renderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.engine = engine;
    this.pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  destroy() {
    this.resizeObserver?.disconnect();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * this.pixelRatio));
    const height = Math.max(1, Math.floor(rect.height * this.pixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.engine.camera?.setViewport(width, height);
  }

  getTransform() {
    if (this.engine.camera) return this.engine.camera.getTransform();
    const scale = Math.min(this.canvas.width / WORLD.width, this.canvas.height / WORLD.height);
    const ox = (this.canvas.width - WORLD.width * scale) / 2;
    const oy = (this.canvas.height - WORLD.height * scale) / 2;
    return { scale, ox, oy };
  }

  clientToCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * this.pixelRatio,
      y: (clientY - rect.top) * this.pixelRatio
    };
  }

  clientToWorld(clientX, clientY) {
    const point = this.clientToCanvas(clientX, clientY);
    if (this.engine.camera) return this.engine.camera.screenToWorld(point.x, point.y);
    const { scale, ox, oy } = this.getTransform();
    return {
      x: clamp((point.x - ox) / scale, 0, WORLD.width - 0.001),
      y: clamp((point.y - oy) / scale, 0, WORLD.height - 0.001)
    };
  }

  worldToClient(x, y) {
    const screen = this.engine.camera
      ? this.engine.camera.worldToScreen(x, y)
      : (() => {
          const { scale, ox, oy } = this.getTransform();
          return { x: x * scale + ox, y: y * scale + oy };
        })();
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + screen.x / this.pixelRatio,
      y: rect.top + screen.y / this.pixelRatio
    };
  }

  draw() {
    const ctx = this.ctx;
    const { scale, ox, oy } = this.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#07111b';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    this.drawSky(ctx);
    this.drawWater(ctx);
    this.drawTerrain(ctx);
    this.engine.game?.render?.(ctx);
    this.drawRigidBodies(ctx);
    this.drawParticles(ctx);
    this.drawDebug(ctx);
    this.drawCursor(ctx);
    ctx.restore();
  }

  drawSky(ctx) {
    const atmosphere = this.engine.atmosphere;
    const storm = clamp((Math.abs(atmosphere.wind) / 28) * 0.55 + (atmosphere.rain / 100) * 0.7, 0, 1);
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    gradient.addColorStop(0, `rgb(${Math.round(24 - storm * 12)}, ${Math.round(51 - storm * 18)}, ${Math.round(76 - storm * 18)})`);
    gradient.addColorStop(0.66, `rgb(${Math.round(96 - storm * 35)}, ${Math.round(135 - storm * 42)}, ${Math.round(157 - storm * 38)})`);
    gradient.addColorStop(1, '#aab8bc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    if (atmosphere.rain > 0.5) {
      ctx.strokeStyle = `rgba(202,225,239,${0.12 + atmosphere.rain / 250})`;
      ctx.lineWidth = 1;
      const count = Math.floor(30 + atmosphere.rain * 1.8);
      const t = this.engine.simTime;
      for (let i = 0; i < count; i++) {
        const x = (i * 73 + t * 210 + (i % 7) * 31) % WORLD.width;
        const y = (i * 47 + t * 530) % 460;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - atmosphere.wind * 0.08, y + 9 + atmosphere.rain * 0.03);
        ctx.stroke();
      }
    }
  }

  drawWater(ctx) {
    const water = this.engine.water;
    const waves = this.engine.surfaceWaves;
    const grad = ctx.createLinearGradient(0, WORLD.seaLevelY - 70, 0, WORLD.height);
    grad.addColorStop(0, 'rgba(29,142,190,0.82)');
    grad.addColorStop(0.5, 'rgba(12,91,139,0.9)');
    grad.addColorStop(1, 'rgba(5,47,81,0.97)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.height);
    for (let i = 0; i < water.n; i++) {
      const x = (i + 0.5) * water.dx;
      const baseY = water.surfaceYAtIndex(i);
      const ripple = water.h[i] > 0.2 ? waves.displacement[i] : 0;
      ctx.lineTo(x, baseY + ripple);
    }
    ctx.lineTo(WORLD.width, WORLD.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(157,225,243,0.68)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < water.n; i++) {
      if (water.h[i] <= 0.2) {
        started = false;
        continue;
      }
      const x = (i + 0.5) * water.dx;
      const y = water.surfaceYAtIndex(i) + waves.displacement[i];
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(237,250,252,0.75)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    started = false;
    for (let i = 0; i < water.n; i++) {
      if (water.breaking[i] < 0.18 || water.h[i] <= 0.2) {
        started = false;
        continue;
      }
      const x = (i + 0.5) * water.dx;
      const y = water.surfaceYAtIndex(i) + waves.displacement[i] - water.breaking[i] * 2;
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  drawTerrain(ctx) {
    const terrain = this.engine.terrain;
    const s = terrain.cellSize;

    for (let y = 0; y < terrain.rows; y++) {
      for (let x = 0; x < terrain.cols; x++) {
        const idx = terrain.index(x, y);
        const id = terrain.material[idx];
        if (id === MATERIALS.AIR.id) continue;
        const mat = MATERIAL_BY_ID[id] || MATERIALS.ROCK;
        const integrity = terrain.integrity[idx];
        const moisture = terrain.moisture[idx];

        ctx.fillStyle = mat.color;
        ctx.globalAlpha = 0.72 + integrity * 0.28;
        ctx.fillRect(x * s, y * s, s + 0.5, s + 0.5);

        if (moisture > 0.28 && id !== MATERIALS.ROCK.id && id !== MATERIALS.CONCRETE.id) {
          ctx.fillStyle = `rgba(20,45,54,${moisture * 0.18})`;
          ctx.fillRect(x * s, y * s, s + 0.5, s + 0.5);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Smooth-looking surface contour over the underlying physical grid.
    ctx.strokeStyle = 'rgba(17,27,31,0.5)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let x = 0; x < terrain.cols; x++) {
      const y = terrain.columnTopCell(x) * s;
      const px = (x + 0.5) * s;
      if (x === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.stroke();
  }

  drawRigidBodies(ctx) {
    for (const body of this.engine.rigidBodies.bodies) {
      ctx.save();
      ctx.translate(body.x, body.y);
      ctx.rotate(body.angle);
      ctx.fillStyle = body.material === 'concrete' ? '#b5bcc0' : '#8a5f38';
      ctx.strokeStyle = 'rgba(20,24,25,0.8)';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-body.width / 2, -body.height / 2, body.width, body.height);
      ctx.strokeRect(-body.width / 2, -body.height / 2, body.width, body.height);
      ctx.restore();
    }
  }

  drawParticles(ctx) {
    for (const p of this.engine.particles.items) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.type === 'foam') ctx.fillStyle = `rgba(239,250,252,${alpha * 0.85})`;
      else if (p.type === 'water') ctx.fillStyle = `rgba(117,207,235,${alpha * 0.75})`;
      else ctx.fillStyle = `rgba(191,151,88,${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDebug(ctx) {
    const debug = this.engine.debug;
    const water = this.engine.water;
    const terrain = this.engine.terrain;

    if (debug.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= WORLD.width; x += terrain.cellSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke();
      }
      for (let y = 0; y <= WORLD.height; y += terrain.cellSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
      }
    }

    if (debug.velocity) {
      for (let i = 0; i < water.n; i += 10) {
        if (water.h[i] <= 1) continue;
        const x = (i + 0.5) * water.dx;
        const y = water.surfaceYAtIndex(i) + Math.min(55, water.h[i] * 0.35);
        const u = water.velocityAtIndex(i);
        ctx.strokeStyle = 'rgba(255,236,125,0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + clamp(u * 0.08, -32, 32), y);
        ctx.stroke();
      }
    }

    if (debug.pressure) {
      for (let i = 0; i < water.n; i += 4) {
        const h = water.h[i];
        if (h <= 1) continue;
        const a = clamp(h / 230, 0, 0.42);
        ctx.fillStyle = `rgba(255,83,79,${a})`;
        ctx.fillRect(i * water.dx, water.surfaceYAtIndex(i), water.dx * 4, h);
      }
    }

    if (debug.sediment) {
      for (let i = 0; i < water.n; i += 2) {
        const c = water.sediment[i];
        if (c < 0.02) continue;
        ctx.fillStyle = `rgba(204,158,85,${clamp(c * 0.18, 0.05, 0.6)})`;
        ctx.fillRect(i * water.dx, water.surfaceYAtIndex(i), water.dx * 2, Math.min(water.h[i], 80));
      }
    }

    if (debug.moisture) {
      const s = terrain.cellSize;
      for (let y = 0; y < terrain.rows; y++) {
        for (let x = 0; x < terrain.cols; x++) {
          const idx = terrain.index(x, y);
          const m = terrain.moisture[idx];
          if (m < 0.1) continue;
          ctx.fillStyle = `rgba(54,156,224,${m * 0.42})`;
          ctx.fillRect(x * s, y * s, s, s);
        }
      }
    }
  }

  drawCursor(ctx) {
    const pointer = this.engine.pointer;
    if (!pointer.inside) return;
    const radius = this.engine.brushSize * this.engine.terrain.cellSize;
    ctx.strokeStyle = 'rgba(255,255,255,0.76)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
