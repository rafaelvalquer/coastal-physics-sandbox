import { WORLD } from "../engine/world/constants.js";

const OVERLAYS = [
  "WATER",
  "VELOCITY",
  "WAVE_ENERGY",
  "EROSION",
  "SEDIMENT",
  "SATURATION",
  "FLOOD_RISK",
  "STRUCTURAL",
  "POWER",
  "EVACUATION"
];

export { OVERLAYS };

export class GameplayOverlayRenderer {
  draw(ctx, overlay, game) {
    if (!overlay) return;
    const engine = game.engine;
    const water = engine.water;
    const terrain = engine.terrain;

    if (overlay === "WATER" || overlay === "FLOOD_RISK") {
      for (let i = 0; i < water.n; i += 2) {
        const depth = water.h[i] / 48;
        if (depth <= 0.02) continue;
        const alpha = overlay === "FLOOD_RISK"
          ? Math.min(0.65, Math.max(0, depth - 0.1) * 0.55)
          : Math.min(0.45, depth * 0.22);
        ctx.fillStyle = overlay === "FLOOD_RISK"
          ? "rgba(238, 101, 77, " + alpha + ")"
          : "rgba(45, 161, 221, " + alpha + ")";
        ctx.fillRect(
          i * water.dx,
          water.surfaceYAtIndex(i),
          water.dx * 2,
          Math.max(1, water.h[i])
        );
      }
      return;
    }

    if (overlay === "VELOCITY") {
      ctx.strokeStyle = "rgba(255, 229, 105, 0.9)";
      for (let i = 0; i < water.n; i += 12) {
        if (water.h[i] <= 1) continue;
        const velocity = water.velocityAtIndex(i) / 48;
        const x = (i + 0.5) * water.dx;
        const y = water.surfaceYAtIndex(i) + Math.min(28, water.h[i] * 0.25);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.max(-30, Math.min(30, velocity * 18)), y);
        ctx.stroke();
      }
      return;
    }

    if (overlay === "WAVE_ENERGY") {
      for (let i = 0; i < water.n; i += 4) {
        const energy = Math.min(1, Math.abs(water.q[i]) / 2800 + water.breaking[i]);
        if (energy < 0.04) continue;
        ctx.fillStyle = "rgba(242, 171, 68, " + Math.min(0.55, energy * 0.5) + ")";
        ctx.fillRect(i * water.dx, water.surfaceYAtIndex(i), water.dx * 4, 14);
      }
      return;
    }

    if (overlay === "SEDIMENT") {
      for (let i = 0; i < water.n; i += 3) {
        const concentration = water.sediment[i];
        if (concentration <= 0.01) continue;
        ctx.fillStyle = "rgba(190, 139, 72, " + Math.min(0.6, concentration * 0.16) + ")";
        ctx.fillRect(i * water.dx, water.surfaceYAtIndex(i), water.dx * 3, Math.min(70, water.h[i]));
      }
      return;
    }

    if (overlay === "EROSION" || overlay === "SATURATION") {
      const s = terrain.cellSize;
      for (let x = 0; x < terrain.cols; x++) {
        const y = terrain.columnTopCell(x);
        if (y >= terrain.rows) continue;
        const index = terrain.index(x, y);
        const value = overlay === "EROSION"
          ? 1 - (terrain.integrity[index] || 0)
          : terrain.moisture[index] || 0;
        if (value < 0.08) continue;
        ctx.fillStyle = overlay === "EROSION"
          ? "rgba(241, 92, 67, " + Math.min(0.7, value * 0.65) + ")"
          : "rgba(70, 138, 235, " + Math.min(0.6, value * 0.55) + ")";
        ctx.fillRect(x * s, y * s, s, s * 2);
      }
      return;
    }

    if (overlay === "STRUCTURAL") {
      for (const building of game.buildings.list()) {
        const risk = 1 - building.integrityRatio;
        ctx.fillStyle = "rgba(236, 74, 68, " + Math.max(0.08, risk * 0.65) + ")";
        ctx.fillRect(
          building.x - building.width / 2 - 3,
          building.y - building.height - 3,
          building.width + 6,
          building.height + 6
        );
      }
      return;
    }

    if (overlay === "POWER") {
      for (const building of game.buildings.list()) {
        const critical = building.type === "POWER_PLANT" || building.type === "HOSPITAL" || building.type === "CITY_HALL";
        if (!critical) continue;
        ctx.strokeStyle = building.operational
          ? "rgba(91, 226, 135, .9)"
          : "rgba(240, 80, 72, .9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          building.x - building.width / 2 - 4,
          building.y - building.height - 4,
          building.width + 8,
          building.height + 8
        );
      }
      return;
    }

    if (overlay === "EVACUATION") {
      ctx.strokeStyle = "rgba(104, 211, 219, .85)";
      ctx.lineWidth = 3;
      for (const edge of game.roads.edges.values()) {
        const a = game.roads.nodes.get(edge.a);
        const b = game.roads.nodes.get(edge.b);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}
