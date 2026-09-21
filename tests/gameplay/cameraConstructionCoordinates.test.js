import test from "node:test";
import assert from "node:assert/strict";
import { WorldCamera } from "../../src/gameplay/camera/WorldCamera.js";
import { PlacementValidator } from "../../src/gameplay/construction/PlacementValidator.js";
import { Budget } from "../../src/gameplay/economy/Budget.js";

test("clique convertido pela câmera chega à mesma coordenada usada pela construção", () => {
  const camera = new WorldCamera({ worldWidth: 1280, worldHeight: 720 });
  camera.setViewport(1920, 1080);
  camera.focusOn(850, 390, 1.8);

  const intended = { x: 760, y: 410 };
  const screen = camera.worldToScreen(intended.x, intended.y);
  const clickWorld = camera.screenToWorld(screen.x, screen.y);

  const terrain = {
    rows: 100,
    cellSize: 8,
    moisture: new Float32Array(100),
    worldToCell: (x) => ({ x: Math.floor(x / 8), y: 0 }),
    columnTopCell: () => 50,
    index: () => 50,
    getMaterial: () => ({ name: "Areia" })
  };
  const water = { n: 320, dx: 4, h: new Float32Array(320) };
  const validator = new PlacementValidator({
    terrain,
    water,
    budget: new Budget(100000),
    buildingManager: { near: () => [] }
  });

  const result = validator.validate("CONCRETE_WALL", clickWorld, 20);
  assert.equal(result.valid, true);
  assert.ok(Math.abs(clickWorld.x - intended.x) < 0.001);
  assert.ok(Math.abs(clickWorld.y - intended.y) < 0.001);
});
