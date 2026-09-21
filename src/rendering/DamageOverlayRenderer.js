export class DamageOverlayRenderer {
  draw(ctx, buildings = []) {
    for (const building of buildings) {
      if (building.integrityRatio >= 0.8) continue;
      ctx.fillStyle = "rgba(200, 74, 65, " + Math.min(0.36, (1 - building.integrityRatio) * 0.5) + ")";
      ctx.fillRect(
        building.x - building.width / 2,
        building.y - building.height,
        building.width,
        building.height
      );
    }
  }
}
