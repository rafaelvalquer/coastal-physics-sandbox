import { WORLD } from '../world/constants.js';
import { clamp } from '../utils/math.js';

export class ParticleSystem {
  constructor() {
    this.items = [];
  }

  spawnFoam(x, y, vx, vy, intensity = 0.5) {
    if (this.items.length >= WORLD.maxParticles) return;
    const count = 1 + Math.floor(intensity * 3);
    for (let i = 0; i < count && this.items.length < WORLD.maxParticles; i++) {
      this.items.push({
        type: 'foam',
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 4,
        vx: vx + (Math.random() - 0.5) * 30,
        vy: vy - Math.random() * 20,
        life: 0.5 + Math.random() * 1.4,
        maxLife: 1.9,
        radius: 1.5 + Math.random() * 2.8
      });
    }
  }

  spawnSediment(x, y, currentV = 0) {
    if (this.items.length >= WORLD.maxParticles) return;
    for (let i = 0; i < 5 && this.items.length < WORLD.maxParticles; i++) {
      this.items.push({
        type: 'sediment',
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 7,
        vx: currentV * 0.22 + (Math.random() - 0.5) * 18,
        vy: -5 - Math.random() * 14,
        life: 0.7 + Math.random() * 1.6,
        maxLife: 2.3,
        radius: 1 + Math.random() * 2.2
      });
    }
  }

  spawnSplash(x, y, strength = 1) {
    if (this.items.length >= WORLD.maxParticles) return;
    const count = Math.min(20, 4 + Math.floor(Math.abs(strength) * 4));
    for (let i = 0; i < count && this.items.length < WORLD.maxParticles; i++) {
      const angle = -Math.PI * (0.12 + Math.random() * 0.76);
      const speed = 45 + Math.random() * 85 * Math.max(0.5, Math.abs(strength));
      this.items.push({
        type: 'water',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.55 + Math.random() * 0.7,
        maxLife: 1.25,
        radius: 1.2 + Math.random() * 2.2
      });
    }
  }

  update(dt, water, terrain) {
    const next = [];
    for (const p of this.items) {
      p.life -= dt;
      if (p.life <= 0) continue;

      const wind = 0.4;
      p.vx += wind * dt;
      p.vy += (p.type === 'foam' ? 115 : 250) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < -20 || p.x > WORLD.width + 20 || p.y > WORLD.height + 20) continue;

      const waterY = water.surfaceYAtX(clamp(p.x, 0, WORLD.width - 1));
      if ((p.type === 'water' || p.type === 'foam') && p.y > waterY) {
        p.y = waterY - 1;
        p.vy *= -0.08;
        p.vx = p.vx * 0.65 + water.velocityAtX(p.x) * 0.25;
        p.life *= 0.86;
      }

      const terrainY = terrain.columnTopWorldYAt(clamp(p.x, 0, WORLD.width - 1));
      if (p.y > terrainY) p.life = 0;
      if (p.life > 0) next.push(p);
    }
    this.items = next;
  }

  serialize() {
    return this.items.slice(0, 400);
  }

  hydrate(items) {
    this.items = Array.isArray(items) ? items.slice(0, WORLD.maxParticles) : [];
  }
}
