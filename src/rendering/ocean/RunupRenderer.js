export class RunupRenderer {
  draw(ctx, engine) {
    const runup = engine.game?.runup?.snapshot?.();
    if (!runup || runup.frontX <= runup.baselineShorelineX + 2) return;

    const terrain = engine.terrain;
    const frontY = terrain.columnTopWorldYAt(runup.frontX);
    const reach = Math.max(0, runup.frontX - runup.baselineShorelineX);

    ctx.save();
    ctx.strokeStyle = "rgba(242, 250, 248, 0.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(Math.max(runup.baselineShorelineX, runup.frontX - Math.min(55, reach)), frontY + 1);
    ctx.lineTo(runup.frontX + 5, frontY + 1);
    ctx.stroke();
    ctx.restore();
  }
}
