import test from "node:test";
import assert from "node:assert/strict";
import { WorldCamera } from "../../src/gameplay/camera/WorldCamera.js";

test("WorldCamera mantém round-trip world/screen após pan e zoom", () => {
  const camera = new WorldCamera({ worldWidth: 1280, worldHeight: 720, zoom: 1.4 });
  camera.setViewport(1800, 1000);
  camera.focusOn(820, 390, 1.55);

  const screen = camera.worldToScreen(940, 420);
  const world = camera.screenToWorld(screen.x, screen.y);

  assert.ok(Math.abs(world.x - 940) < 0.001);
  assert.ok(Math.abs(world.y - 420) < 0.001);
});

test("zoom ancorado preserva o ponto do mundo sob o cursor", () => {
  const camera = new WorldCamera({ worldWidth: 1280, worldHeight: 720, zoom: 1 });
  camera.setViewport(1600, 900);

  const anchor = { x: 1100, y: 460 };
  const before = camera.screenToWorld(anchor.x, anchor.y);
  camera.zoomBy(1.35, anchor.x, anchor.y);
  const after = camera.screenToWorld(anchor.x, anchor.y);

  assert.ok(Math.abs(before.x - after.x) < 0.01);
  assert.ok(Math.abs(before.y - after.y) < 0.01);
});

test("camera respeita limites do mundo durante pan", () => {
  const camera = new WorldCamera({ worldWidth: 1280, worldHeight: 720, zoom: 2 });
  camera.setViewport(1280, 720);
  camera.panWorld(-10000, -10000);
  const a = camera.visibleWorldRect();
  assert.ok(a.minX >= 0);
  assert.ok(a.minY >= 0);

  camera.panWorld(20000, 20000);
  const b = camera.visibleWorldRect();
  assert.ok(b.maxX <= 1280);
  assert.ok(b.maxY <= 720);
});

test("estado da câmera é serializável", () => {
  const camera = new WorldCamera({ worldWidth: 1280, worldHeight: 720 });
  camera.setViewport(1500, 900);
  camera.focusOn(910, 410, 1.72);

  const restored = new WorldCamera({ worldWidth: 1280, worldHeight: 720 });
  restored.setViewport(1500, 900);
  restored.hydrate(camera.serialize());

  assert.equal(restored.zoom, camera.zoom);
  assert.equal(restored.x, camera.x);
  assert.equal(restored.y, camera.y);
});
