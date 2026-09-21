import { clampCameraCenter } from "./CameraBounds.js";

export class WorldCamera {
  constructor({
    worldWidth,
    worldHeight,
    minZoom = 0.55,
    maxZoom = 2.5,
    zoom = 0.9
  }) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.zoom = zoom;
    this.x = worldWidth * 0.58;
    this.y = worldHeight * 0.54;
    this.viewportWidth = worldWidth;
    this.viewportHeight = worldHeight;
  }

  setViewport(width, height) {
    this.viewportWidth = Math.max(1, Number(width) || 1);
    this.viewportHeight = Math.max(1, Number(height) || 1);
    this.clamp();
  }

  getBaseScale() {
    return Math.min(
      this.viewportWidth / this.worldWidth,
      this.viewportHeight / this.worldHeight
    );
  }

  getScale() {
    return this.getBaseScale() * this.zoom;
  }

  getTransform() {
    const scale = this.getScale();
    return {
      scale,
      ox: this.viewportWidth / 2 - this.x * scale,
      oy: this.viewportHeight / 2 - this.y * scale
    };
  }

  screenToWorld(px, py) {
    const { scale, ox, oy } = this.getTransform();
    return {
      x: Math.max(0, Math.min(this.worldWidth - 0.001, (px - ox) / scale)),
      y: Math.max(0, Math.min(this.worldHeight - 0.001, (py - oy) / scale))
    };
  }

  worldToScreen(x, y) {
    const { scale, ox, oy } = this.getTransform();
    return {
      x: x * scale + ox,
      y: y * scale + oy
    };
  }

  setZoom(value, anchorPx = null, anchorPy = null) {
    const before = anchorPx == null || anchorPy == null
      ? null
      : this.screenToWorld(anchorPx, anchorPy);

    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Number(value) || 1));

    if (before) {
      const after = this.screenToWorld(anchorPx, anchorPy);
      this.x += before.x - after.x;
      this.y += before.y - after.y;
    }

    this.clamp();
    return this.zoom;
  }

  zoomBy(factor, anchorPx = null, anchorPy = null) {
    return this.setZoom(this.zoom * factor, anchorPx, anchorPy);
  }

  panWorld(dx, dy) {
    this.x += Number(dx) || 0;
    this.y += Number(dy) || 0;
    this.clamp();
  }

  panScreen(dxPixels, dyPixels) {
    const scale = this.getScale();
    this.panWorld(-(Number(dxPixels) || 0) / scale, -(Number(dyPixels) || 0) / scale);
  }

  focusOn(x, y, zoom = this.zoom) {
    this.x = Number(x) || this.worldWidth / 2;
    this.y = Number(y) || this.worldHeight / 2;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.clamp();
  }

  focusBounds(bounds, padding = 48) {
    if (!bounds) return this.fitWorld();
    const width = Math.max(1, bounds.maxX - bounds.minX + padding * 2);
    const height = Math.max(1, bounds.maxY - bounds.minY + padding * 2);
    const base = this.getBaseScale();
    const desiredScale = Math.min(
      this.viewportWidth / width,
      this.viewportHeight / height
    );
    const desiredZoom = desiredScale / Math.max(0.0001, base);
    this.x = (bounds.minX + bounds.maxX) / 2;
    this.y = (bounds.minY + bounds.maxY) / 2;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, desiredZoom));
    this.clamp();
  }

  fitWorld() {
    this.x = this.worldWidth / 2;
    this.y = this.worldHeight / 2;
    this.zoom = 1;
    this.clamp();
  }

  visibleWorldRect() {
    const scale = this.getScale();
    const halfW = this.viewportWidth / scale / 2;
    const halfH = this.viewportHeight / scale / 2;
    return {
      minX: Math.max(0, this.x - halfW),
      minY: Math.max(0, this.y - halfH),
      maxX: Math.min(this.worldWidth, this.x + halfW),
      maxY: Math.min(this.worldHeight, this.y + halfH)
    };
  }

  clamp() {
    clampCameraCenter(this);
  }

  snapshot() {
    return {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      visibleWorldRect: this.visibleWorldRect()
    };
  }

  serialize() {
    return { x: this.x, y: this.y, zoom: this.zoom };
  }

  hydrate(value = {}) {
    if (Number.isFinite(value.x)) this.x = value.x;
    if (Number.isFinite(value.y)) this.y = value.y;
    if (Number.isFinite(value.zoom)) {
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, value.zoom));
    }
    this.clamp();
  }
}
