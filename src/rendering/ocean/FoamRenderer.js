export class FoamRenderer {
  draw(ctx, engine) {
    const water = engine.water;
    const waves = engine.surfaceWaves;
    const sea = engine.game?.seaState?.state;
    const gain = sea?.visualWaveGain || 1.6;
    const time = engine.simTime;

    ctx.save();
    ctx.fillStyle = "rgba(239, 250, 252, 0.68)";

    for (let i = 1; i < water.n - 1; i += 2) {
      const breaking = water.breaking[i];
      if (breaking < 0.18 || water.h[i] <= 0.15) continue;

      const x = (i + 0.5) * water.dx;
      const y = water.surfaceYAtIndex(i) + waves.displacement[i] * gain;
      const count = 1 + Math.floor(breaking * 3);

      for (let j = 0; j < count; j++) {
        const offset = Math.sin(time * 3.1 + i * 1.7 + j * 2.2) * 4;
        ctx.beginPath();
        ctx.ellipse(
          x + offset + j * 3,
          y - 1 - j,
          2.5 + breaking * 3,
          0.8 + breaking,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
