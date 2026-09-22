export class ConstructionRenderer {
  draw(ctx, constructions = []) {
    for (const construction of constructions) {
      const width = Math.max(12, Math.min(360, construction.length * 12));
      ctx.save();
      ctx.translate(construction.x, construction.y);

      if (construction.type === "CONCRETE_WALL") {
        ctx.fillStyle = "#aab4b9";
        ctx.fillRect(-width / 2, -10, width, 10);
      } else if (construction.type === "RIPRAP" || construction.type === "BREAKWATER") {
        ctx.fillStyle = construction.type === "BREAKWATER" ? "#626b70" : "#77746c";
        for (let x = -width / 2; x < width / 2; x += 10) {
          ctx.beginPath();
          ctx.arc(x, -4 - Math.abs((x / 10) % 2) * 3, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (construction.type === "DUNE") {
        ctx.fillStyle = "#d8b66a";
        ctx.beginPath();
        ctx.moveTo(-width / 2, 0);
        ctx.quadraticCurveTo(0, -18, width / 2, 0);
        ctx.fill();
      } else if (construction.type === "VEGETATION") {
        ctx.strokeStyle = "#4e884f";
        for (let x = -width / 2; x < width / 2; x += 8) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 2, -9);
          ctx.stroke();
        }
      } else if (construction.type === "DRAINAGE") {
        ctx.strokeStyle = "#577d8d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-width / 2, 0);
        ctx.lineTo(width / 2, 0);
        ctx.stroke();
      }

      const risk = construction.effectiveness?.riskLabel;
      if (risk) {
        const label = risk === "CRITICAL" ? "⚠" : risk === "WARNING" ? "!" : "✓";
        ctx.font = "bold 12px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = risk === "CRITICAL"
          ? "#ff766b"
          : risk === "WARNING"
            ? "#f1c85a"
            : "#72d8a1";
        ctx.strokeStyle = "rgba(4,12,17,.9)";
        ctx.lineWidth = 3;
        ctx.strokeText(label, 0, -24);
        ctx.fillText(label, 0, -24);
      }

      ctx.restore();
    }
  }
}
