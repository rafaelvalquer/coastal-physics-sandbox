export const WORLD = {
  width: 1280,
  height: 720,
  terrainCell: 8,
  waterDx: 4,
  fixedDt: 1 / 120,
  // 48 px ≈ 1 m, so 9.81 m/s² ≈ 470.88 px/s².
  gravity: 470.88,
  seaLevelY: 430,
  maxParticles: 1400
};

export const TOOLS = {
  INSPECT: 'inspect',
  IMPULSE: 'impulse',
  DIG: 'dig',
  COMPACT: 'compact',
  SAND: 'sand',
  SOIL: 'soil',
  ROCK: 'rock',
  CONCRETE: 'concrete',
  DEBRIS: 'debris'
};
