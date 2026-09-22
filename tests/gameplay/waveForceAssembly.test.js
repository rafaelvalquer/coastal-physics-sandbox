import test from "node:test";
import assert from "node:assert/strict";
import { StructuralGrid } from "../../src/gameplay/structural/StructuralGrid.js";
import { StructuralBlock } from "../../src/gameplay/structural/StructuralBlock.js";
import { StructuralAssembly } from "../../src/gameplay/structural/StructuralAssembly.js";
import { StructuralForces } from "../../src/gameplay/structural/StructuralForces.js";

test("aumento de profundidade e velocidade aumenta força horizontal", () => {
  const grid = new StructuralGrid();
  const block = new StructuralBlock({ type: "CONCRETE_BLOCK", gridX: 20, gridY: 20 });
  const assembly = new StructuralAssembly({ id: "a", blocks: [block] });
  assembly.recalculate(grid);

  const foundation = {
    grid,
    getResistanceForAssembly: () => ({
      soilFactor: 1, anchorHorizontal: 0, anchorVertical: 0, anchorMoment: 0,
      pileHorizontal: 0, pileVertical: 0, pileMoment: 0, bearingCapacity: 100000, underPressure: 0
    })
  };

  const makeWater = (depthPx, velocityPx) => ({
    n: 100, dx: 4, h: new Float32Array(100).fill(depthPx),
    velocityAtIndex: () => velocityPx,
    surfaceYAtX: () => 300
  });

  const calm = StructuralForces.calculate(assembly, { water: makeWater(12, 10), foundation });
  const storm = StructuralForces.calculate(assembly, { water: makeWater(72, 80), foundation });
  assert.ok(storm.horizontalForce > calm.horizontalForce);
});
