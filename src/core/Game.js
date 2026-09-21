import { EventBus } from "./EventBus.js";
import { CommandBus } from "./CommandBus.js";
import { GameClock } from "./GameClock.js";
import { GameState } from "./GameState.js";
import { GameLoop } from "./GameLoop.js";
import { SeededRandom } from "./SeededRandom.js";
import { ScenarioLoader } from "../scenarios/ScenarioLoader.js";

import { BuildingManager } from "../gameplay/buildings/BuildingManager.js";
import { FoundationSystem } from "../gameplay/buildings/FoundationSystem.js";
import { BuildingDamageSystem } from "../gameplay/buildings/BuildingDamageSystem.js";

import { EconomyManager } from "../gameplay/economy/EconomyManager.js";

import { ClimateProfile } from "../gameplay/weather/ClimateProfile.js";
import { WeatherDirector } from "../gameplay/weather/WeatherDirector.js";

import { PlacementValidator } from "../gameplay/construction/PlacementValidator.js";
import { ConstructionManager } from "../gameplay/construction/ConstructionManager.js";
import { ConstructionPreview } from "../gameplay/construction/ConstructionPreview.js";
import { ConstructionTool } from "../gameplay/construction/ConstructionTool.js";
import { PhysicsConstructionAdapter } from "../gameplay/construction/PhysicsConstructionAdapter.js";

import { ObjectiveManager } from "../gameplay/objectives/ObjectiveManager.js";
import { FailureManager } from "../gameplay/objectives/FailureManager.js";
import { CityResilience } from "../gameplay/objectives/CityResilience.js";
import { TutorialManager } from "../gameplay/objectives/TutorialManager.js";

import { PopulationManager } from "../gameplay/population/PopulationManager.js";
import { RoadNetwork } from "../gameplay/roads/RoadNetwork.js";
import { EvacuationManager } from "../gameplay/evacuation/EvacuationManager.js";
import { PowerNetwork } from "../gameplay/utilities/PowerNetwork.js";
import { WaterUtilitySystem } from "../gameplay/utilities/WaterUtilitySystem.js";
import { CampaignManager } from "../gameplay/campaign/CampaignManager.js";
import { DifficultyManager } from "../gameplay/campaign/DifficultyManager.js";
import { AchievementManager } from "../gameplay/campaign/AchievementManager.js";
import { TechnologyTree } from "../gameplay/technology/TechnologyTree.js";

import { BuildingRenderer } from "../rendering/BuildingRenderer.js";
import { ConstructionRenderer } from "../rendering/ConstructionRenderer.js";
import { DamageOverlayRenderer } from "../rendering/DamageOverlayRenderer.js";
import { WeatherRenderer } from "../rendering/WeatherRenderer.js";
import { GameplayOverlayRenderer, OVERLAYS } from "../rendering/GameplayOverlayRenderer.js";
import { ConstructionPreviewRenderer } from "../rendering/ConstructionPreviewRenderer.js";

export class Game {
  constructor(engine, scenarioId = "porto-esperanca", difficulty = "NORMAL") {
    this.engine = engine;
    this.scenario = ScenarioLoader.load(scenarioId);
    this.eventBus = new EventBus();
    this.commandBus = new CommandBus();
    this.clock = new GameClock();
    this.state = new GameState();
    this.loop = new GameLoop({ gameplayDt: 0.1 });
    this.random = new SeededRandom(this.scenario.seed);
    this.difficulty = new DifficultyManager(difficulty);

    this.buildings = new BuildingManager(this.eventBus);
    for (const config of this.scenario.buildings) {
      this.buildings.add({
        ...config,
        y: engine.terrain.columnTopWorldYAt(config.x)
      });
    }

    this.population = new PopulationManager({
      initialPopulation: this.scenario.initialPopulation,
      eventBus: this.eventBus
    });
    this.population.seed(this.buildings.list().filter((building) => building.type === "HOUSE"));
    for (const household of this.population.households) {
      const home = this.buildings.get(household.homeBuildingId);
      if (home) home.occupants += household.members;
    }

    this.economy = new EconomyManager({
      initialBalance: this.scenario.initialBalance * this.difficulty.profile.initialBudgetMultiplier,
      eventBus: this.eventBus
    });

    this.physicsAdapter = new PhysicsConstructionAdapter(engine, this.eventBus);
    this.validator = new PlacementValidator({
      terrain: engine.terrain,
      water: engine.water,
      budget: this.economy.budget,
      buildingManager: this.buildings
    });
    this.constructions = new ConstructionManager({
      eventBus: this.eventBus,
      budget: this.economy.budget,
      validator: this.validator,
      physicsAdapter: this.physicsAdapter
    });
    this.preview = new ConstructionPreview(this.validator);
    this.constructionTool = new ConstructionTool({
      constructionManager: this.constructions,
      preview: this.preview
    });

    this.foundation = new FoundationSystem({
      terrain: engine.terrain,
      water: engine.water,
      eventBus: this.eventBus
    });
    this.damage = new BuildingDamageSystem({
      terrain: engine.terrain,
      water: engine.water,
      atmosphere: engine.atmosphere,
      buildingManager: this.buildings,
      eventBus: this.eventBus,
      damageMultiplier: this.difficulty.profile.damageMultiplier
    });

    this.climate = new ClimateProfile({
      stormChancePerDay: 0.015 * this.difficulty.profile.stormChanceMultiplier
    });
    this.weather = new WeatherDirector({
      random: this.random,
      eventBus: this.eventBus,
      profile: this.climate
    });

    this.objectives = new ObjectiveManager({
      eventBus: this.eventBus,
      scenario: this.scenario
    });
    this.failure = new FailureManager();
    this.resilience = new CityResilience();
    this.tutorial = new TutorialManager(this.scenario.tutorial, this.eventBus);

    this.roads = new RoadNetwork();
    this.power = new PowerNetwork();
    this.waterUtility = new WaterUtilitySystem();
    this.evacuation = new EvacuationManager({
      population: this.population,
      roads: this.roads,
      eventBus: this.eventBus
    });
    this.campaign = new CampaignManager();
    this.technology = new TechnologyTree();
    this.economy.maintenance.multiplier = this.difficulty.profile.maintenanceMultiplier;
    this.achievements = new AchievementManager(this.eventBus);

    this.buildingRenderer = new BuildingRenderer();
    this.constructionRenderer = new ConstructionRenderer();
    this.damageOverlayRenderer = new DamageOverlayRenderer();
    this.weatherRenderer = new WeatherRenderer();
    this.overlayRenderer = new GameplayOverlayRenderer();
    this.constructionPreviewRenderer = new ConstructionPreviewRenderer();

    this.lastSnapshot = null;
    this.seedInfrastructure();
    this.bindEvents();
    this.bindCommands();
    this.scheduleOnboardingStorm();
  }

  seedInfrastructure() {
    this.roads.addNode("center", 900, 360);
    this.roads.addNode("hospital", 850, 300);
    this.roads.addNode("hills", 1120, 250);
    this.roads.addEdge("road-hospital", "hospital", "center", {
      length: 2.2,
      capacity: 160,
      speedLimit: 40
    });
    this.roads.addEdge("road-hills", "center", "hills", {
      length: 4.4,
      capacity: 220,
      speedLimit: 50
    });

    this.power.addNode("plant", { generation: 220 });
    this.power.addNode("hospital", { demand: 55, backupGenerator: true });
    this.power.addNode("city", { demand: 115 });
    this.power.connect("plant", "hospital");
    this.power.connect("plant", "city");
  }

  bindEvents() {
    this.eventBus.on("building:destroyed", ({ buildingId }) => {
      this.population.buildingDestroyed(buildingId);
      const building = this.buildings.get(buildingId);
      this.state.pushMessage("Edificação destruída: " + buildingId, "danger", {
        entityId: buildingId,
        x: building?.x,
        y: building?.y
      });
    });
    this.eventBus.on("building:damaged", ({ buildingId }) => {
      const building = this.buildings.get(buildingId);
      if (building && building.integrityRatio < 0.6) {
        this.state.pushMessage("Dano severo em " + buildingId, "warning", {
          entityId: buildingId,
          x: building.x,
          y: building.y
        });
      }
    });
    this.eventBus.on("construction:placed", ({ construction }) => {
      this.state.pushMessage("Construído: " + construction.type, "success");
      if (this.tutorial.current === "BUILD_20M_PROTECTION") this.tutorial.complete();
    });
    this.eventBus.on("storm:forecast", () => {
      this.state.pushMessage("Nova previsão de tempestade disponível.", "warning");
      if (this.tutorial.current === "OPEN_FORECAST") this.tutorial.complete();
    });
    this.eventBus.on("storm:started", () => {
      this.state.pushMessage("Tempestade atingiu Porto Esperança.", "danger");
    });
    this.eventBus.on("storm:ended", () => {
      this.state.pushMessage("Tempestade encerrada. Inspecione os danos.", "info");
      if (this.tutorial.current === "REVIEW_DAMAGE") this.tutorial.complete();
    });
    this.eventBus.on("drainage:overflow", () => {
      this.state.pushMessage("Drenagem operando acima da capacidade.", "warning");
    });
    this.eventBus.on("construction:failed", ({ constructionId }) => {
      const construction = this.constructions.list().find((item) => item.id === constructionId);
      this.state.pushMessage("Falha estrutural em " + constructionId, "danger", {
        entityId: constructionId,
        x: construction?.x,
        y: construction?.y
      });
    });
    this.eventBus.on("objective:completed", ({ id }) => {
      this.technology.grant(1);
      this.state.pushMessage("Objetivo concluído: " + id + " · +1 pesquisa", "success");
    });
    this.eventBus.on("achievement:unlocked", ({ id }) => {
      this.state.pushMessage("Conquista desbloqueada: " + id, "success");
    });
  }

  bindCommands() {
    this.commandBus.register("construction:select", ({ type, length = 20 }) => {
      this.selectConstruction(type, length);
      return { ok: true };
    });
    this.commandBus.register("construction:cancel", () => {
      this.clearConstruction();
      return { ok: true };
    });
    this.commandBus.register("evacuation:issue", ({ type }) => {
      const requested = this.evacuation.issue(type);
      if (this.tutorial.current === "PREPARE_STORM") this.tutorial.complete();
      return { ok: true, requested };
    });
    this.commandBus.register("building:repair", ({ id, amount = 25, cost = 1500 }) => {
      const building = this.buildings.get(id);
      if (!building) return { ok: false, reason: "Prédio não encontrado" };
      if (!this.economy.budget.spend(cost, "REPAIR", id)) {
        return { ok: false, reason: "Orçamento insuficiente" };
      }
      building.repair(amount);
      if (this.tutorial.current === "REPAIR") this.tutorial.complete();
      return { ok: true, building };
    });
  }

  scheduleOnboardingStorm() {
    const date = new Date(this.clock.startDate);
    date.setUTCDate(date.getUTCDate() + 390);
    this.weather.schedule(date);
  }

  setSpeed(speed) {
    this.clock.setSpeed(speed);
    if (speed === 0) {
      this.engine.setRunning(false);
      return;
    }
    this.engine.setRunning(true);
    this.engine.setSimulationSpeed(speed);
  }

  selectConstruction(type, length = 20) {
    this.constructionTool.select(type, length);
    this.state.selectedConstruction = type;
  }

  clearConstruction() {
    this.constructionTool.clear();
    this.state.selectedConstruction = null;
  }

  setOverlayByIndex(index) {
    const overlay = OVERLAYS[index] || null;
    this.state.overlay = this.state.overlay === overlay ? null : overlay;
    return this.state.overlay;
  }

  inspectAt(x, y) {
    const building = this.buildings.near(x, y, 70).find((candidate) =>
      x >= candidate.x - candidate.width / 2 &&
      x <= candidate.x + candidate.width / 2 &&
      y >= candidate.y - candidate.height &&
      y <= candidate.y
    );
    if (!building) return null;
    return {
      id: building.id,
      type: building.type,
      integrity: building.integrity,
      integrityRatio: building.integrityRatio,
      operational: building.operational,
      occupants: building.occupants,
      capacity: building.capacity,
      foundation: { ...building.foundation }
    };
  }

  handleWorldClick(x, y) {
    if (!this.state.selectedConstruction) {
      const inspection = this.engine.inspectWorld?.(x, y) || null;
      this.state.selectInspection(inspection);
      if (this.tutorial.current === "INSPECT_COAST") this.tutorial.complete();
      return inspection;
    }
    const result = this.constructionTool.place({ x, y });
    if (result.ok) this.clearConstruction();
    else this.state.pushMessage(result.reason || "Construção inválida", "warning");
    return result;
  }

  update(physicsDt) {
    const scale = Math.max(1, this.clock.timeScale || 1);
    this.loop.consume(physicsDt, (dt) => {
      const calendarDt = dt / scale;
      this.clock.update(calendarDt);
      this.weather.update(calendarDt, this.clock);

      const weather = this.weather.state;
      this.engine.atmosphere.wind = weather.windSpeed / 3.6;
      this.engine.atmosphere.rain = weather.rainfall;
      this.engine.atmosphere.tide = weather.tideOffset;
      this.engine.atmosphere.gustiness = Math.min(1, 0.18 + weather.stormIntensity * 0.75);

      this.foundation.update(this.buildings.list(), dt);
      this.damage.update(dt);
      this.physicsAdapter.update(dt, this.constructions.list());
      this.constructions.update(dt);

      this.roads.updateFlooding(this.engine.water);
      this.evacuation.update(dt);

      const powerPlant = this.buildings.get("power-plant");
      const hospital = this.buildings.get("hospital");
      const cityHall = this.buildings.get("city-hall");
      this.power.nodes.get("plant").operational = Boolean(powerPlant?.operational);
      this.power.nodes.get("hospital").operational = Boolean(hospital?.operational);
      this.power.nodes.get("city").operational = Boolean(cityHall?.operational);
      const powerState = this.power.update();

      const flooded = this.buildings.list().some((building) => {
        const index = Math.max(
          0,
          Math.min(this.engine.water.n - 1, Math.floor(building.x / this.engine.water.dx))
        );
        return this.engine.water.h[index] / 48 > 0.25;
      });
      const waterState = this.waterUtility.update({
        population: this.population.population,
        flooded
      });

      this.economy.update(this.clock, {
        population: this.population.population,
        portOperational: Boolean(this.buildings.get("port")?.operational),
        maintenanceItems: [...this.buildings.list(), ...this.constructions.list()]
      });

      const snapshot = this.createSnapshot(powerState, waterState);
      this.objectives.evaluate(snapshot);
      const failure = this.failure.evaluate(snapshot);
      if (failure.failed && this.state.status === "RUNNING") {
        this.state.status = "LOST";
        this.state.pushMessage("Derrota: " + failure.reason, "danger");
      }

      const goals = this.scenario.goals;
      const survived = snapshot.yearsSurvived >= goals.surviveYears;
      const populationOk = snapshot.populationRatio >= goals.minPopulationRatio;
      const criticalOk = goals.criticalBuildings.every(
        (id) => snapshot.buildings[id]?.operational
      );
      if (survived && populationOk && criticalOk && this.state.status === "RUNNING") {
        this.state.status = "WON";
        this.campaign.complete(this.scenario.id);
        this.technology.grant(3);
        this.eventBus.emit("scenario:won", { scenarioId: this.scenario.id });
        this.state.pushMessage("Vitória em " + this.scenario.name + ".", "success");
      }

      this.lastSnapshot = snapshot;
    });
  }

  createSnapshot(powerState = this.power.update(), waterState = this.waterUtility.snapshot()) {
    const buildings = Object.fromEntries(
      this.buildings.list().map((building) => [building.id, {
        id: building.id,
        type: building.type,
        integrity: building.integrity,
        integrityRatio: building.integrityRatio,
        operational: building.operational,
        foundation: { ...building.foundation }
      }])
    );
    const infrastructure = this.buildings.list().length
      ? this.buildings.list().reduce((sum, building) => sum + building.integrityRatio, 0) /
        this.buildings.list().length
      : 1;
    const economyRatio = Math.max(0, Math.min(1.2, this.economy.budget.balance / this.scenario.initialBalance));
    const score = this.resilience.calculate({
      infrastructure,
      population: this.population.ratio,
      power: powerState.available ? 1 : 0.35,
      water: waterState.operational ? 1 : 0.35,
      economy: Math.min(1, economyRatio)
    });

    return {
      scenarioId: this.scenario.id,
      scenarioName: this.scenario.name,
      status: this.state.status,
      date: this.clock.getDate().toISOString(),
      yearsSurvived: this.clock.getElapsedDays() / 365,
      population: this.population.population,
      populationRatio: this.population.ratio,
      homeless: this.population.homeless,
      evacuated: this.population.evacuated,
      balance: this.economy.budget.balance,
      resilience: score,
      buildings,
      constructions: this.constructions.list().map((construction) => construction.serialize()),
      forecast: this.weather.getForecast(3),
      weather: { ...this.weather.state },
      stormPhase: this.weather.phase,
      objectives: this.objectives.status(),
      tutorial: {
        current: this.tutorial.current,
        completed: this.tutorial.completed
      },
      selectedConstruction: this.state.selectedConstruction,
      selectedInspection: this.state.selectedInspection,
      constructionPreview: this.state.selectedConstruction && this.engine.pointer?.inside
        ? this.constructionTool.inspect({ x: this.engine.pointer.x, y: this.engine.pointer.y })
        : null,
      overlay: this.state.overlay,
      messages: this.state.messages,
      power: powerState,
      waterUtility: waterState,
      researchPoints: this.technology.points,
      technology: [...this.technology.unlocked],
      achievements: [...this.achievements.unlocked],
      difficulty: this.difficulty.level,
      campaign: this.campaign.serialize()
    };
  }

  snapshot() {
    return this.lastSnapshot || this.createSnapshot();
  }

  render(ctx) {
    this.weatherRenderer.draw(ctx, this.weather.state);
    this.constructionRenderer.draw(ctx, this.constructions.list());
    this.buildingRenderer.draw(ctx, this.buildings.list());
    this.damageOverlayRenderer.draw(ctx, this.buildings.list());
    this.overlayRenderer.draw(ctx, this.state.overlay, this);
    this.constructionPreviewRenderer.draw(ctx, this);
  }

  serialize() {
    return {
      saveVersion: 1,
      scenarioId: this.scenario.id,
      gameClock: this.clock.serialize(),
      gameState: this.state.serialize(),
      buildings: this.buildings.serialize(),
      constructions: this.constructions.serialize(),
      economy: this.economy.serialize(),
      weather: this.weather.serialize(),
      population: this.population.serialize(),
      objectives: this.objectives.serialize(),
      tutorial: this.tutorial.serialize(),
      power: this.power.serialize(),
      waterUtility: this.waterUtility.serialize(),
      technology: this.technology.serialize(),
      campaign: this.campaign.serialize(),
      achievements: this.achievements.serialize(),
      difficulty: this.difficulty.serialize()
    };
  }

  hydrate(value = {}) {
    this.clock.hydrate(value.gameClock || {});
    this.state.hydrate(value.gameState || {});
    this.buildings.hydrate(value.buildings || []);
    this.population.hydrate(value.population || {});
    this.economy.hydrate(value.economy || {});
    this.weather.hydrate(value.weather || {});
    this.objectives.hydrate(value.objectives || {});
    this.tutorial.hydrate(value.tutorial || {});
    this.power.hydrate(value.power || {});
    this.waterUtility.hydrate(value.waterUtility || {});
    this.technology.hydrate(value.technology || {});
    this.campaign.hydrate(value.campaign || {});
    this.achievements.hydrate(value.achievements || {});
    if (value.difficulty?.level) this.difficulty.set(value.difficulty.level);
    this.constructions.hydrate(value.constructions || []);
    this.lastSnapshot = this.createSnapshot();
  }
}
