export const MATERIALS = {
  AIR: {
    id: 0,
    key: 'AIR',
    name: 'Ar',
    color: 'rgba(0,0,0,0)',
    solid: false,
    erodibility: 0,
    criticalShear: Infinity,
    permeability: 1,
    cohesion: 0,
    density: 1.2
  },
  SAND: {
    id: 1,
    key: 'SAND',
    name: 'Areia',
    color: '#d8b66a',
    solid: true,
    erodibility: 0.07,
    criticalShear: 0.6,
    permeability: 0.86,
    cohesion: 0.08,
    density: 1600
  },
  SOIL: {
    id: 2,
    key: 'SOIL',
    name: 'Terra',
    color: '#805536',
    solid: true,
    erodibility: 0.018,
    criticalShear: 8,
    permeability: 0.48,
    cohesion: 0.5,
    density: 1750
  },
  ROCK: {
    id: 3,
    key: 'ROCK',
    name: 'Rocha',
    color: '#626a70',
    solid: true,
    erodibility: 0.0004,
    criticalShear: 180,
    permeability: 0.025,
    cohesion: 0.96,
    density: 2700
  },
  CONCRETE: {
    id: 4,
    key: 'CONCRETE',
    name: 'Concreto',
    color: '#9ba4aa',
    solid: true,
    erodibility: 0.00008,
    criticalShear: 700,
    permeability: 0.005,
    cohesion: 1,
    density: 2350
  },
  CLAY: {
    id: 5,
    key: 'CLAY',
    name: 'Argila',
    color: '#a56d56',
    solid: true,
    erodibility: 0.008,
    criticalShear: 16,
    permeability: 0.12,
    cohesion: 0.76,
    density: 1850
  },
  GRAVEL: {
    id: 6,
    key: 'GRAVEL',
    name: 'Cascalho',
    color: '#8d8376',
    solid: true,
    erodibility: 0.03,
    criticalShear: 3.5,
    permeability: 0.72,
    cohesion: 0.2,
    density: 1900
  }
};

export const MATERIAL_BY_ID = Object.fromEntries(
  Object.values(MATERIALS).map((material) => [material.id, material])
);
