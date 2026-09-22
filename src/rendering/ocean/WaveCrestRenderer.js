export class WaveCrestRenderer {
  draw(ctx, engine) {
    const water = engine.water;
    const waves = engine.surfaceWaves;
    const sea = engine.game?.seaState?.state;
    const gain = sea?.visualWaveGain || 1.6;

    ctx.save();
    ctx.lineCap = "round";

    for (let i = 2; i < water.n - 2; i++) {
      if (water.h[i] <= 0.25) continue;
      const d = waves.displacement[i] * gain;
      const left = waves.displacement[i - 1] * gain;
      const right = waves.displacement[i + 1] * gain;
      const crest = d < left && d < right;
      const breaking = water.breaking[i];

      if (!crest && breaking < 0.14) continue;

      const x = (i + 0.5) * water.dx;
      const y = water.surfaceYAtIndex(i) + d;
      const width = 8 + Math.min(20, Math.abs(d) * 1.1 + breaking * 18);

      ctx.strokeStyle = breaking > 0.2
        ? "rgba(245, 252, 253, 0.9)"
        : "rgba(205, 241, 248, 0.62)";
      ctx.lineWidth = 1.3 + breaking * 2.2;
      ctx.beginPath();
      ctx.moveTo(x - width * 0.5, y);
      ctx.quadraticCurveTo(x, y - 2 - breaking * 4, x + width * 0.5, y + 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}
