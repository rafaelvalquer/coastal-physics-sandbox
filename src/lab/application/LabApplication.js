import { EventBus } from "../../core/EventBus.js";
import { CommandBus } from "../../core/CommandBus.js";
import { BuildingManager } from "../../gameplay/buildings/BuildingManager.js";
import { FoundationSystem } from "../../gameplay/buildings/FoundationSystem.js";
import { BuildingDamageSystem } from "../../gameplay/buildings/BuildingDamageSystem.js";
import { BuildingStructuralSystem } from "../../gameplay/buildings/BuildingStructuralSystem.js";
import { PlacementValidator } from "../../gameplay/construction/PlacementValidator.js";
import { ConstructionManager } from "../../gameplay/construction/ConstructionManager.js";
import { CoastalConstruction } from "../../gameplay/construction/CoastalConstruction.js";
import { PhysicsConstructionAdapter } from "../../gameplay/construction/PhysicsConstructionAdapter.js";
import { OffshoreWaveGenerator } from "../../gameplay/ocean/OffshoreWaveGenerator.js";
import { CoastalRunupSystem } from "../../gameplay/ocean/CoastalRunupSystem.js";
import { OvertoppingSystem } from "../../gameplay/ocean/OvertoppingSystem.js";
import { FloodZoneManager } from "../../gameplay/flood/FloodZoneManager.js";
import { FloodFrontTracker } from "../../gameplay/flood/FloodFrontTracker.js";
import { UrbanFloodDamage } from "../../gameplay/flood/UrbanFloodDamage.js";
import { BuildingRenderer } from "../../rendering/BuildingRenderer.js";
import { BuildingAssemblyRenderer } from "../../rendering/BuildingAssemblyRenderer.js";
import { ConstructionRenderer } from "../../rendering/ConstructionRenderer.js";
import { ExperimentDefinition } from "../experiment/ExperimentDefinition.js";
import { ExperimentManager } from "../experiment/ExperimentManager.js";
import { ExperimentSerializer } from "../experiment/ExperimentSerializer.js";
import { ScenarioEditor } from "../scenario/ScenarioEditor.js";
import { ScenarioSerializer } from "../scenario/ScenarioSerializer.js";
import { DisasterController } from "../disaster/DisasterController.js";
import { DisasterDefinition } from "../disaster/DisasterDefinition.js";
import { SimulationRunner } from "../simulation/SimulationRunner.js";
import { MetricsRecorder } from "../telemetry/MetricsRecorder.js";
import { ReplayRecorder } from "../replay/ReplayRecorder.js";
import { ReplayPlayer } from "../replay/ReplayPlayer.js";
import { RunComparison } from "../comparison/RunComparison.js";
import { ChallengeManager } from "../challenges/ChallengeManager.js";
import { LabState } from "./LabState.js";
import { bindLabCommands } from "./LabCommands.js";
import { LabHeatmapRenderer,LAB_OVERLAYS } from "../rendering/LabHeatmapRenderer.js";
import { LabEditorRenderer } from "../rendering/LabEditorRenderer.js";

const FLOOD_ZONES=[
 {id:"coastal",name:"Faixa costeira",minX:620,maxX:760,priority:"HIGH"},
 {id:"urban",name:"Zona urbana",minX:760,maxX:930,priority:"HIGH"},
 {id:"critical",name:"Infraestrutura crítica",minX:930,maxX:1080,priority:"CRITICAL"},
 {id:"high",name:"Terreno elevado",minX:1080,maxX:1275,priority:"SAFE"}
];

export class LabApplication{
 constructor(engine){
  this.engine=engine;this.eventBus=new EventBus();this.commandBus=new CommandBus();this.state=new LabState();this.overlay=null;this.eventLog=[];this.finalSnapshot=null;this.comparison=null;
  this.experiments=new ExperimentManager(new ExperimentDefinition({name:"Extreme Weather Sandbox",mode:"SANDBOX",map:{template:"procedural-coast",seed:48212}}));
  this.buildings=new BuildingManager(this.eventBus);
  this.physicsAdapter=new PhysicsConstructionAdapter(engine,this.eventBus);
  this.validator=new PlacementValidator({terrain:engine.terrain,water:engine.water,budget:null,buildingManager:this.buildings});
  this.constructions=new ConstructionManager({eventBus:this.eventBus,budget:null,validator:this.validator,physicsAdapter:this.physicsAdapter});
  this.editor=new ScenarioEditor({engine,buildings:this.buildings,constructions:this.constructions,eventBus:this.eventBus});
  this.editor.seed=this.experiments.current.map.seed;
  this.editor.applyTemplate(this.experiments.current.map.template);
  this.buildingStructures=new BuildingStructuralSystem({engine,buildingManager:this.buildings,eventBus:this.eventBus});
  this.buildingStructures.rebuildAll();
  this.foundation=new FoundationSystem({terrain:engine.terrain,water:engine.water,eventBus:this.eventBus});
  this.damage=new BuildingDamageSystem({terrain:engine.terrain,water:engine.water,atmosphere:engine.atmosphere,buildingManager:this.buildings,eventBus:this.eventBus,damageMultiplier:1});
  this.seaState={state:{phase:"EDIT",significantWaveHeight:.4,maximumWaveHeight:.65,wavePeriod:6.5,direction:90,groupIntensity:1,irregularity:.16,tide:0,stormSurge:0,totalLevel:0,energy:.05,visualWaveGain:1.8}};
  this.offshoreWaves=new OffshoreWaveGenerator({water:engine.water,surfaceWaves:engine.surfaceWaves,seaState:this.seaState,eventBus:this.eventBus});
  this.refreshObservers();
  this.disasterController=new DisasterController({engine,experiment:this.experiments.current,eventBus:this.eventBus,seaState:this.seaState});
  this.metrics=new MetricsRecorder({sampleHz:5});this.replay=new ReplayRecorder();this.replayPlayer=new ReplayPlayer({app:this});this.challenges=new ChallengeManager();
  this.runner=new SimulationRunner({app:this});this.buildingRenderer=new BuildingRenderer();this.buildingAssemblyRenderer=new BuildingAssemblyRenderer();this.constructionRenderer=new ConstructionRenderer();this.heatmapRenderer=new LabHeatmapRenderer();this.editorRenderer=new LabEditorRenderer();
  this.bindEvents();bindLabCommands(this);engine.setRunning(false);engine.setSimulationSpeed(1);
 }
 refreshObservers(){
  this.runup=new CoastalRunupSystem({water:this.engine.water,terrain:this.engine.terrain,eventBus:this.eventBus});
  this.overtopping=new OvertoppingSystem({water:this.engine.water,constructions:this.constructions,eventBus:this.eventBus});
  this.floodZones=new FloodZoneManager({zones:FLOOD_ZONES,water:this.engine.water,buildings:this.buildings,eventBus:this.eventBus});
  this.floodFront=new FloodFrontTracker({water:this.engine.water,shorelineX:this.runup.baselineShorelineX,buildings:this.buildings});
  this.urbanFlood=new UrbanFloodDamage({floodZones:this.floodZones,eventBus:this.eventBus});
 }
 bindEvents(){
  const log=(type,label,severity="info")=>this.eventBus.on(type,payload=>this.recordEvent(label,severity,payload));
  log("coast:overtopping","Ultrapassagem de defesa","warning");log("building:destroyed","Edificação destruída","danger");log("construction:failed","Defesa costeira falhou","danger");log("flood:threshold","Novo limiar de inundação","warning");
  this.eventBus.on("city:flood-state",p=>{if(p.severity!=="DRY")this.recordEvent("Estado de inundação: "+p.severity,p.severity==="STRUCTURAL"?"danger":"warning",p);});
 }
 recordEvent(label,severity="info",payload={}){
  const event={id:"event-"+Date.now()+"-"+this.eventLog.length,time:this.runner?.clock?.elapsedSeconds||0,label,severity,payload:structuredClone(payload||{})};this.eventLog.push(event);this.eventLog=this.eventLog.slice(-160);this.replay?.recordEvent(event);this.state.message(label,severity,{event});return event;
 }
 loadTemplate(id){
  if(this.runner.state==="RUNNING")return {ok:false,reason:"Finalize a simulação antes de editar"};
  this.editor.seed=this.experiments.current.map.seed;
  const template=this.editor.applyTemplate(id);this.buildingStructures.rebuildAll();this.experiments.edit(e=>{e.map.template=template.id;e.buildings=this.buildings.serialize();e.structures=this.constructions.serialize();});this.refreshObservers();this.disasterController.experiment=this.experiments.current;this.runner.baseline.value=null;this.engine.camera.fitWorld();return {ok:true,template:template.serialize()};
 }
 startChallenge(id){
  const challenge=this.challenges.start(id);if(!challenge)return {ok:false,reason:"Desafio não encontrado"};
  this.experiments.replace(new ExperimentDefinition({name:challenge.title,mode:"CHALLENGE",map:{template:challenge.template,seed:48212},disaster:challenge.event,environment:{soilSaturation:challenge.environment?.soilSaturation??.35},constraints:{budget:challenge.budget}}));
  this.editor.setBudget(challenge.budget);this.editor.seed=this.experiments.current.map.seed;this.editor.applyTemplate(challenge.template);this.buildingStructures.rebuildAll();this.refreshObservers();this.disasterController.experiment=this.experiments.current;this.disasterController.rebuild();this.runner.baseline.value=null;this.state.analysisOpen=false;this.engine.camera.fitWorld();return {ok:true,challenge};
 }
 setExperienceMode(mode){
  const next=mode==="CAMPAIGN"?"CAMPAIGN":"SIMULATOR";
  this.state.experienceMode=next;
  if(next==="SIMULATOR"&&this.experiments.current.mode==="CHALLENGE")this.startSandbox();
  this.state.message(next==="SIMULATOR"?"Modo Simulador ativado":"Modo Campanha ativado","info");
  return {ok:true,mode:next};
 }
 startSandbox(){
  this.challenges.clear();this.experiments.replace(new ExperimentDefinition({name:"Sandbox",mode:"SANDBOX",map:{template:"procedural-coast",seed:48212}}));this.editor.setBudget(null);this.editor.seed=this.experiments.current.map.seed;this.editor.applyTemplate("procedural-coast");this.buildingStructures.rebuildAll();this.refreshObservers();this.disasterController.experiment=this.experiments.current;this.disasterController.rebuild();this.runner.baseline.value=null;this.state.analysisOpen=false;return {ok:true};
 }
 prepareRun(){
  this.eventLog=[];this.state.messages=[];this.metrics.reset(this.engine.water.n);this.replay.reset();this.finalSnapshot=null;this.comparison=null;this.damage.elapsed=0;this.disasterController.experiment=this.experiments.current;this.disasterController.rebuild();this.disasterController.prepareEnvironment();this.disasterController.update(0);this.engine.water.refreshBed();this.engine.water.updateDerived?.();this.recordEvent("Simulação iniciada","info");
 }
 resetTransient(){this.metrics.reset(this.engine.water.n);this.replay.reset();this.eventLog=[];this.finalSnapshot=null;this.comparison=null;this.state.analysisOpen=false;this.refreshObservers();this.disasterController.experiment=this.experiments.current;this.disasterController.rebuild();}
 finishRun(){
  const result=this.metrics.finalize(this);this.finalSnapshot=this.captureReplayState();this.recordEvent("Simulação concluída","success");const previous=this.experiments.runHistory[0];if(previous)this.comparison=RunComparison.compare(previous,result);const challenge=this.challenges.evaluate(result,{cost:this.editor.spent,usedTools:[...this.editor.usedTools]});if(challenge)this.state.message(challenge.completed?"Desafio concluído":"Objetivos não concluídos",challenge.completed?"success":"warning");this.state.analysisOpen=true;return result;
 }
 update(dt){
  this.runner.update(dt);if(this.runner.state!=="RUNNING")return;this.offshoreWaves.update(dt);this.physicsAdapter.update(dt,this.constructions.list());this.constructions.update(dt);this.foundation.update(this.buildings.list(),dt);this.damage.update(dt);this.buildingStructures.update(dt);
 }
 postPhysicsUpdate(dt){
  if(this.runner.state!=="RUNNING")return;this.runup.update(dt);this.overtopping.update(dt);this.floodZones.update(dt);this.floodFront.update(dt);this.urbanFlood.update();this.runner.postPhysics(dt);
 }
 handlePointerDown(x,y){if(this.runner.state!=="EDIT"&&this.runner.state!=="COMPLETED")return null;if(this.editor.activeTool==="INSPECT")return this.handleWorldClick(x,y);const r=this.editor.pointerDown(x,y);if(r)this.experiments.dirty=true;return r;}
 handlePointerMove(x,y){if(this.runner.state!=="EDIT"&&this.runner.state!=="COMPLETED")return;this.editor.pointerMove(x,y);}
 handlePointerUp(x,y){if(this.runner.state!=="EDIT"&&this.runner.state!=="COMPLETED")return null;const r=this.editor.pointerUp(x,y);if(r)this.experiments.dirty=true;return r;}
 handleWorldClick(x,y){const inspection=this.engine.inspectWorld(x,y);this.state.inspect(inspection);return inspection;}
 inspectAt(x,y){return this.buildings.near(x,y,45).find(b=>x>=b.x-b.width/2&&x<=b.x+b.width/2&&y>=b.y-b.height&&y<=b.y)||null;}
 inspectConstructionAt(x,y){return this.constructions.list().find(c=>Math.abs(c.x-x)<=Math.max(16,c.length*6)&&Math.abs(c.y-y)<36)||null;}
 setOverlayByIndex(index){const o=LAB_OVERLAYS[index]||null;this.overlay=this.overlay===o?null:o;return this.overlay;}
 compareRuns(aId,bId){const runs=this.experiments.runHistory,a=runs.find(r=>r.id===aId)||runs[1],b=runs.find(r=>r.id===bId)||runs[0];this.comparison=RunComparison.compare(a,b);return this.comparison;}
 showAnalysisView(view){this.state.analysisView=view;if(view==="BEFORE"&&this.runner.baseline.value)this.runner.baseline.restore(this.engine,this);else if(view==="AFTER"&&this.finalSnapshot)this.hydrateReplayState(this.finalSnapshot);}
 render(ctx){this.editorRenderer.draw(ctx,this);this.constructionRenderer.draw(ctx,this.constructions.list());this.buildingRenderer.draw(ctx,this.buildings.list().filter(b=>!b.structuralAssemblyId));this.buildingAssemblyRenderer.draw(ctx,this.buildingStructures);this.heatmapRenderer.draw(ctx,this);}
 serializeScene(){return {buildings:this.buildings.serialize(),buildingStructures:this.buildingStructures.serialize(),constructions:this.constructions.serialize(),physicsAdapter:{snapshots:[...this.physicsAdapter.snapshots.entries()],drains:[...this.physicsAdapter.drains.entries()],footprints:[...this.physicsAdapter.footprints.entries()]},editor:this.editor.snapshot()};}
 hydrateScene(v={}){
  this.buildings.hydrate(v.buildings||[]);this.constructions.items.clear();let max=0;for(const raw of v.constructions||[]){const c=new CoastalConstruction(raw);this.constructions.items.set(c.id,c);const n=Number(String(c.id).split("-").at(-1));if(Number.isFinite(n))max=Math.max(max,n);}this.constructions.sequence=max+1;
  this.physicsAdapter.snapshots=new Map(v.physicsAdapter?.snapshots||[]);this.physicsAdapter.drains=new Map(v.physicsAdapter?.drains||[]);this.physicsAdapter.footprints=new Map(v.physicsAdapter?.footprints||[]);
  this.buildingStructures.hydrate(v.buildingStructures||{});const e=v.editor||{};this.editor.roads=structuredClone(e.roads||[]);this.editor.seed=Number(e.seed??this.experiments.current.map.seed);this.editor.spent=Number(e.spent||0);this.editor.budgetLimit=e.budgetLimit??this.editor.budgetLimit;this.editor.usedTools=new Set(e.usedTools||[]);this.editor.template=ScenarioSerializer.get(e.template||this.experiments.current.map.template);this.engine.water.refreshBed();this.refreshObservers();
 }
 captureReplayState(){return {terrain:this.engine.terrain.serialize(),water:this.engine.water.serialize(),surfaceWaves:this.engine.surfaceWaves.serialize(),atmosphere:this.engine.atmosphere.serialize(),erosion:this.engine.erosion.serialize(),scene:this.serializeScene()};}
 hydrateReplayState(v){if(!v)return;this.engine.terrain.hydrate(v.terrain);this.engine.atmosphere.hydrate(v.atmosphere);this.engine.water.hydrate(v.water);this.engine.surfaceWaves.hydrate(v.surfaceWaves);this.engine.erosion.hydrate(v.erosion);this.hydrateScene(v.scene||{});}
 snapshot(){
  const result=this.experiments.runHistory[0]?.serialize?.()||this.experiments.runHistory[0]||null;
  return {mode:"LAB",experienceMode:this.state.experienceMode||"SIMULATOR",scenarioName:this.editor.template?.name||"Extreme Weather Lab",buildingStructures:this.buildingStructures.snapshot(),experiment:this.experiments.snapshot(),runner:this.runner.snapshot(),editor:this.editor.snapshot(),disaster:this.disasterController.snapshot(),metrics:this.metrics.snapshot(),result,comparison:this.comparison,challenge:this.challenges.snapshot(),events:this.eventLog.slice(-80),overlay:this.overlay,templates:ScenarioSerializer.list(),state:this.state.snapshot(),selectedInspection:this.state.selectedInspection,messages:this.state.messages};
 }
 serialize(){return {saveVersion:4,type:"LAB_EXPERIMENT",experienceMode:this.state.experienceMode,experiment:this.experiments.current.serialize(),experimentState:this.experiments.state,scene:this.serializeScene(),baseline:this.runner.baseline.serialize(),lastRun:this.experiments.runHistory[0]?.serialize?.()||null,runs:this.experiments.runHistory.map(r=>r.serialize?.()||r),challenge:this.challenges.active?.id||null};}
 hydrate(v={}){
  if(v.type!=="LAB_EXPERIMENT")return false;this.state.experienceMode=v.experienceMode==="CAMPAIGN"?"CAMPAIGN":"SIMULATOR";this.experiments.replace(new ExperimentDefinition(v.experiment||{}));this.editor.applyTemplate(this.experiments.current.map.template);this.hydrateScene(v.scene||{});this.runner.baseline.hydrate(v.baseline||null);this.experiments.runHistory=(v.runs||[]);this.disasterController.experiment=this.experiments.current;this.disasterController.rebuild();if(v.challenge)this.challenges.start(v.challenge);return true;
 }
}
