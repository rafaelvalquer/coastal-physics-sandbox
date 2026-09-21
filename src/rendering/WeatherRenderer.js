export class WeatherRenderer {
  draw(ctx, weatherState) {
    if (!weatherState || weatherState.stormIntensity <= 0.05) return;
    ctx.fillStyle = "rgba(25, 35, 48, " + Math.min(0.22, weatherState.stormIntensity * 0.18) + ")";
    ctx.fillRect(0, 0, 1280, 720);
  }
}
