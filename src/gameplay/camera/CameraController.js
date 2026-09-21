export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.dragging = false;
    this.lastClientX = 0;
    this.lastClientY = 0;
    this.panSpeed = 520;
  }

  startDrag(clientX, clientY) {
    this.dragging = true;
    this.lastClientX = clientX;
    this.lastClientY = clientY;
  }

  dragTo(clientX, clientY, pixelRatio = 1) {
    if (!this.dragging) return;
    const dx = (clientX - this.lastClientX) * pixelRatio;
    const dy = (clientY - this.lastClientY) * pixelRatio;
    this.lastClientX = clientX;
    this.lastClientY = clientY;
    this.camera.panScreen(dx, dy);
  }

  endDrag() {
    this.dragging = false;
  }

  update(dt, keys = new Set()) {
    let dx = 0;
    let dy = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) dy -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) dy += 1;
    if (!dx && !dy) return;

    const length = Math.hypot(dx, dy) || 1;
    const worldPerSecond = this.panSpeed / Math.max(0.5, this.camera.zoom);
    this.camera.panWorld(
      dx / length * worldPerSecond * dt,
      dy / length * worldPerSecond * dt
    );
  }
}
