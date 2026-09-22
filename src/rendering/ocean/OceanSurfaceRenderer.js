import { WORLD } from "../../engine/world/constants.js";

export class OceanSurfaceRenderer {
  draw(ctx, engine) {
    const water = engine.water;
    const waves = engine.surfaceWaves;
    const sea = engine.game?.seaState?.state;
    const gain = sea?.visualWaveGain || 1.6;

    const gradient = ctx.createLinearGradient(0, WORLD.seaLevelY - 100, 0, WORLD.height);
    gradient.addColorStop(0, "rgba(39, 154, 198, 0.86)");
    gradient.addColorStop(0.5, "rgba(14, 102, 151, 0.92)");
    gradient.addColorStop(1, "rgba(4, 43, 76, 0.98)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.height);

    for (let i = 0; i < water.n; i++) {
      const x = (i + 0.5) * water.dx;
      const baseY = water.surfaceYAtIndex(i);
      const physicalRipple = water.h[i] > 0.2 ? waves.displacement[i] : 0;
      const visualRipple = physicalRipple * gain;
      ctx.lineTo(x, baseY + visualRipple);
    }

    ctx.lineTo(WORLD.width, WORLD.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(150, 224, 244, 0.72)";
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < water.n; i++) {
      if (water.h[i] <= 0.2) {
        started = false;
        continue;
      }
      const x = (i + 0.5) * water.dx;
      const y = water.surfaceYAtIndex(i) + waves.displacement[i] * gain;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}
