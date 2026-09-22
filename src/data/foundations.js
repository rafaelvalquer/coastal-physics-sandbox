export const FOUNDATION_TYPES = {
  SHALLOW_PILE: {
    id: "SHALLOW_PILE",
    label: "Estaca",
    kind: "PILE",
    depth: 2.5,
    diameter: 0.25,
    material: "STEEL",
    moneyCost: 900,
    workersRequired: 4,
    laborHours: 2,
    materials: { STEEL: 0.18, CONCRETE: 0.25 },
    requiredEquipment: []
  },
  DEEP_PILE: {
    id: "DEEP_PILE",
    label: "Estaca profunda",
    kind: "PILE",
    depth: 5,
    diameter: 0.35,
    material: "STEEL",
    moneyCost: 2800,
    workersRequired: 6,
    laborHours: 5,
    materials: { STEEL: 0.6, CONCRETE: 1.4 },
    requiredEquipment: ["PILE_DRIVER"]
  },
  ROCK_ANCHOR: {
    id: "ROCK_ANCHOR",
    label: "Âncora em rocha",
    kind: "ANCHOR",
    length: 5,
    angle: 32,
    moneyCost: 1800,
    workersRequired: 4,
    laborHours: 3,
    materials: { STEEL: 0.22, CONCRETE: 0.18 },
    requiredEquipment: []
  },
  TIEBACK: {
    id: "TIEBACK",
    label: "Tirante",
    kind: "TIEBACK",
    length: 6,
    angle: 22,
    moneyCost: 1450,
    workersRequired: 4,
    laborHours: 2.5,
    materials: { STEEL: 0.16, CONCRETE: 0.12 },
    requiredEquipment: []
  },
  GEOTEXTILE: {
    id: "GEOTEXTILE",
    label: "Geotêxtil",
    kind: "SOIL_REINFORCEMENT",
    width: 2,
    moneyCost: 180,
    workersRequired: 2,
    laborHours: 0.45,
    materials: { GEOTEXTILE: 4 },
    requiredEquipment: []
  }
};
