export const DIFFICULTIES = {
  EASY: {
    initialBudgetMultiplier: 1.25,
    stormChanceMultiplier: 0.75,
    damageMultiplier: 0.8,
    maintenanceMultiplier: 0.85
  },
  NORMAL: {
    initialBudgetMultiplier: 1,
    stormChanceMultiplier: 1,
    damageMultiplier: 1,
    maintenanceMultiplier: 1
  },
  HARD: {
    initialBudgetMultiplier: 0.82,
    stormChanceMultiplier: 1.35,
    damageMultiplier: 1.25,
    maintenanceMultiplier: 1.2
  }
};

export class DifficultyManager {
  constructor(level = "NORMAL") {
    this.set(level);
  }

  set(level) {
    if (!DIFFICULTIES[level]) throw new Error("Dificuldade desconhecida: " + level);
    this.level = level;
    this.profile = DIFFICULTIES[level];
  }

  serialize() {
    return { level: this.level };
  }
}
