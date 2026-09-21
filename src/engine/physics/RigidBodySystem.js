import { WORLD } from '../world/constants.js';
import { clamp } from '../utils/math.js';

export class RigidBodySystem {
  constructor() {
    this.bodies = [];
    this.nextId = 1;
  }

  spawn(x, y, width = 18, height = 10, density = 650, material = 'wood') {
    this.bodies.push({
      id: this.nextId++,
      x, y,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: (Math.random() - 0.5) * 0.6,
      width,
      height,
      density,
      material,
      restitution: 0.18,
      drag: 0.72
    });
  }

  update(dt, water, terrain) {
    const rhoWater = 1000;
    const gravity = WORLD.gravity;

    for (const body of this.bodies) {
      const surfaceY = water.surfaceYAtX(body.x);
      const top = body.y - body.height / 2;
      const bottom = body.y + body.height / 2;
      const submergedPx = clamp(bottom - surfaceY, 0, body.height);
      const submerged = submergedPx / body.height;

      let ax = 0;
      let ay = gravity;

      if (submerged > 0) {
        // F_b / m = g * rho_water/rho_body * submerged_fraction
        ay -= gravity * (rhoWater / body.density) * submerged;
        const flowU = water.velocityAtX(body.x);
        ax += (flowU - body.vx) * body.drag * submerged * 1.8;
        body.vy += (-body.vy * 1.7 * submerged) * dt;
        body.angularVelocity *= Math.exp(-dt * submerged * 1.8);
      }

      body.vx += ax * dt;
      body.vy += ay * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.angularVelocity * dt;

      body.x = clamp(body.x, body.width / 2, WORLD.width - body.width / 2);
      const groundY = terrain.columnTopWorldYAt(body.x);
      if (body.y + body.height / 2 > groundY) {
        body.y = groundY - body.height / 2;
        if (body.vy > 0) body.vy *= -body.restitution;
        body.vx *= 0.82;
        body.angularVelocity *= 0.72;
      }
    }

    this.bodies = this.bodies.filter((body) => body.y < WORLD.height + 100);
  }

  serialize() {
    return { bodies: this.bodies, nextId: this.nextId };
  }

  hydrate(data) {
    this.bodies = Array.isArray(data?.bodies) ? data.bodies : [];
    this.nextId = Number(data?.nextId || 1);
  }
}
