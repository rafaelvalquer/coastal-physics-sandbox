export function clampCameraCenter(camera) {
  const scale = camera.getScale();
  if (!Number.isFinite(scale) || scale <= 0) return;

  const visibleWidth = camera.viewportWidth / scale;
  const visibleHeight = camera.viewportHeight / scale;

  if (visibleWidth >= camera.worldWidth) {
    camera.x = camera.worldWidth / 2;
  } else {
    const half = visibleWidth / 2;
    camera.x = Math.max(half, Math.min(camera.worldWidth - half, camera.x));
  }

  if (visibleHeight >= camera.worldHeight) {
    camera.y = camera.worldHeight / 2;
  } else {
    const half = visibleHeight / 2;
    camera.y = Math.max(half, Math.min(camera.worldHeight - half, camera.y));
  }
}
