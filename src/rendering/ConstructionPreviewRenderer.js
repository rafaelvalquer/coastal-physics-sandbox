export class ConstructionPreviewRenderer {
  draw(ctx, game) {
    const type = game.state.selectedConstruction;
    const pointer = game.engine.pointer;
    if (!type || !pointer?.inside) return;

    const preview = game.constructionTool.inspect({ x: pointer.x, y: pointer.y });
    if (!preview) return;

    const color = preview.valid
      ? preview.risk === "HIGH"
        ? "rgba(246, 196, 73, .85)"
        : "rgba(77, 220, 142, .85)"
      : "rgba(239, 87, 78, .88)";

    const width = Math.max(20, Math.min(360, game.constructionTool.length * 12));
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color.replace(".85", ".12").replace(".88", ".12");
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(pointer.x - width / 2, pointer.y - 14, width, 18);
    ctx.fillRect(pointer.x - width / 2, pointer.y - 14, width, 18);
    ctx.restore();
  }
}
