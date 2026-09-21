export class BuildingRenderer {
  draw(ctx, buildings = []) {
    for (const building of buildings) {
      const ratio = building.integrityRatio;
      ctx.save();
      ctx.translate(building.x, building.y);

      if (ratio < 0.6) ctx.rotate((1 - ratio) * 0.08);

      ctx.fillStyle = building.operational
        ? ratio > 0.8
          ? "#c8d8df"
          : ratio > 0.6
            ? "#d6bd7b"
            : ratio > 0.3
              ? "#b77458"
              : "#7b4a47"
        : "#4b4243";

      ctx.strokeStyle = ratio < 0.6 ? "#442d2e" : "#263d48";
      ctx.lineWidth = 1.3;
      ctx.fillRect(-building.width / 2, -building.height, building.width, building.height);
      ctx.strokeRect(-building.width / 2, -building.height, building.width, building.height);

      if (ratio < 0.8) {
        ctx.beginPath();
        ctx.moveTo(-building.width * 0.25, -building.height * 0.85);
        ctx.lineTo(0, -building.height * 0.45);
        ctx.lineTo(building.width * 0.15, -building.height * 0.2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
