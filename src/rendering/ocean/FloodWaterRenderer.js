const PX_PER_METER = 48;

export class FloodWaterRenderer {
  draw(ctx, engine) {
    const water = engine.water;
    const terrain = engine.terrain;
    const seaElevation = water.baseSeaElevation + (engine.game?.seaState?.state?.totalLevel || 0) * PX_PER_METER;

    ctx.save();
    for (let i = 0; i < water.n; i++) {
      const depth = water.h[i] / PX_PER_METER;
      if (depth < 0.025) continue;

      const bedElevation = water.bed[i];
      if (bedElevation < seaElevation - 1) continue;

      const x = i * water.dx;
      const surfaceY = water.surfaceYAtIndex(i);
      const groundY = 720 - bedElevation;
      const height = Math.max(1, groundY - surfaceY);
      const alpha = Math.min(0.68, 0.24 + depth * 0.28);

      ctx.fillStyle = "rgba(38, 148, 197, " + alpha + ")";
      ctx.fillRect(x, surfaceY, water.dx + 1, height);

      if (depth > 0.12) {
        ctx.strokeStyle = "rgba(205, 240, 246, " + Math.min(0.65, depth * 0.32) + ")";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, surfaceY);
        ctx.lineTo(x + water.dx + 1, surfaceY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
