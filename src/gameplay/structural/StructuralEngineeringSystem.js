import { StructuralGrid } from "./StructuralGrid.js";
import { StructuralBlock } from "./StructuralBlock.js";
import { AssemblyGraph } from "./AssemblyGraph.js";
import { AssemblyBuilder } from "./AssemblyBuilder.js";
import { StructuralAssembly } from "./StructuralAssembly.js";
import { StabilitySolver } from "./StabilitySolver.js";
import { StructuralFailureSystem } from "./StructuralFailureSystem.js";
import { StructuralFoundationSystem } from "../foundation/StructuralFoundationSystem.js";
import { ResourceInventory } from "../resources/ResourceInventory.js";
import { WorkforceManager } from "../workforce/WorkforceManager.js";
import { ConstructionQueue } from "../jobs/ConstructionQueue.js";
import { ConstructionJob } from "../jobs/ConstructionJob.js";
import { RepairJob } from "../jobs/RepairJob.js";
import { ReinforcementJob } from "../jobs/ReinforcementJob.js";
import { ConstructionScheduler } from "../jobs/ConstructionScheduler.js";
import { StructuralPlacementValidator } from "../construction/StructuralPlacementValidator.js";
import { ConstructionPlanner } from "../construction/ConstructionPlanner.js";
import { STRUCTURAL_BLOCKS } from "../../data/structuralBlocks.js";

export class StructuralEngineeringSystem {
  constructor({engine,eventBus,population,budget,buildings}){
    this.engine=engine;this.eventBus=eventBus;this.grid=new StructuralGrid();this.blocks=new Map();this.graph=new AssemblyGraph();this.assemblies=new Map();
    this.inventory=new ResourceInventory({budget});
    this.workforce=new WorkforceManager({population,eventBus,targetMunicipalWorkers:24});
    this.foundation=new StructuralFoundationSystem({terrain:engine.terrain,water:engine.water,grid:this.grid,eventBus});
    this.builder=new AssemblyBuilder({grid:this.grid,graph:this.graph});
    this.stability=new StabilitySolver({water:engine.water,foundation:this.foundation});
    this.failure=new StructuralFailureSystem({eventBus,rigidBodies:engine.rigidBodies});
    this.queue=new ConstructionQueue();
    this.scheduler=new ConstructionScheduler({queue:this.queue,workforce:this.workforce,inventory:this.inventory,eventBus,onProgress:(job)=>this.onProgress(job),onComplete:(job)=>this.onComplete(job)});
    this.validator=new StructuralPlacementValidator({grid:this.grid,terrain:engine.terrain,buildings,inventory:this.inventory,structuralSystem:this});
    this.planner=new ConstructionPlanner({validator:this.validator,structuralSystem:this});
    this.accumulator=0;this.rebuildNeeded=false;
  }

  findNearestAssembly(x,y,radius=64){let best=null,bestD=radius;for(const a of this.assemblies.values()){if(!a.bounds)continue;const cx=(a.bounds.minX+a.bounds.maxX)/2,cy=(a.bounds.minY+a.bounds.maxY)/2,d=Math.hypot(cx-x,cy-y);if(d<bestD){best=a;bestD=d;}}return best;}

  adjacentBlocks(block){
    const ids=new Set();for(const cell of block.occupiedCells()){for(const n of this.grid.neighbors(cell.x,cell.y)){if(n.blockId&&n.blockId!==block.id)ids.add(n.blockId);}}
    return [...ids].map(id=>this.blocks.get(id)).filter(Boolean);
  }

  connectionType(a,b){
    if(a.type==="ROCK_UNIT"||b.type==="ROCK_UNIT"||a.type==="TETRAPOD"||b.type==="TETRAPOD")return "INTERLOCK";
    if(a.type.includes("CONCRETE")&&b.type.includes("CONCRETE"))return "MORTAR";
    return "CONTACT";
  }

  scheduleBlueprint(blueprint,{desiredWorkers=null}={}){
    const job=new ConstructionJob({blueprint:blueprint.serialize(),laborHours:blueprint.laborHours,workersRequired:blueprint.workersRequired,desiredWorkers:desiredWorkers||blueprint.workersRequired,priority:blueprint.priority});
    const reserve=this.inventory.reserve(job.id,blueprint.requirements());if(!reserve.ok)return reserve;
    if(blueprint.kind==="BLOCK"){
      const block=new StructuralBlock({type:blueprint.type,gridX:blueprint.gridX,gridY:blueprint.gridY,constructionState:"PLANNED",progress:0});
      if(!this.grid.occupyBlock(block)){this.inventory.cancel(job.id);return {ok:false,reason:"Célula ocupada"};}
      job.blueprint.blockId=block.id;this.blocks.set(block.id,block);
      for(const neighbor of this.adjacentBlocks(block))this.graph.connect(block.id,neighbor.id,this.connectionType(block,neighbor));
      this.rebuildAssemblies();
    } else if(blueprint.kind==="FOUNDATION"){
      const element=this.foundation.create({type:blueprint.type,x:blueprint.position.x,y:blueprint.position.y,assemblyId:blueprint.targetAssemblyId});
      element.progress=0;element.constructionState="PLANNED";job.blueprint.foundationId=element.id;
    }
    this.queue.add(job);this.eventBus?.emit("job:planned",{job});return {ok:true,job,blueprint};
  }

  scheduleRepair(assemblyId,{priority="HIGH",workers=4}={}){
    const assembly=this.assemblies.get(assemblyId);if(!assembly)return {ok:false,reason:"Estrutura não encontrada"};
    const job=new RepairJob({targetId:assemblyId,blueprint:{targetId:assemblyId},laborHours:3,workersRequired:4,desiredWorkers:workers,priority,restoreAmount:.25});
    const requirements={cost:1200,materials:{CONCRETE:.8,STEEL:.03},requiredEquipment:[]};const reserve=this.inventory.reserve(job.id,requirements);if(!reserve.ok)return reserve;job.blueprint.requirements=requirements;this.queue.add(job);return {ok:true,job};
  }

  scheduleReinforcement(assemblyId,type,position,options={}){
    this.planner.select(type,"FOUNDATION");const result=this.planner.plan(position,{priority:options.priority||"HIGH",desiredWorkers:options.workers});this.planner.clear();return result;
  }

  onProgress(job){
    if(job.blueprint?.blockId){const b=this.blocks.get(job.blueprint.blockId);if(b){b.progress=job.progress;b.constructionState=job.state;}}
    if(job.blueprint?.foundationId){const e=this.foundation.elements.get(job.blueprint.foundationId);if(e){e.progress=job.progress;e.constructionState=job.state;}}
    if(job.type==="REPAIR"){const a=this.assemblies.get(job.targetId);if(a)a.condition=Math.min(1,a.condition+job.assignedWorkers*.00005);}
    this.rebuildNeeded=true;
  }

  onComplete(job){
    if(job.blueprint?.blockId){const b=this.blocks.get(job.blueprint.blockId);if(b){b.progress=1;b.constructionState="COMPLETED";this.eventBus?.emit("structural:block-completed",{block:b});}}
    if(job.blueprint?.foundationId){const e=this.foundation.elements.get(job.blueprint.foundationId);if(e){e.progress=1;e.constructionState="COMPLETED";}}
    if(job.type==="REPAIR"){const a=this.assemblies.get(job.targetId);if(a){a.condition=Math.min(1,a.condition+(job.restoreAmount||.25));a.failed=false;a.failureMode=null;for(const b of a.blocks)b.integrity=Math.min(1,b.integrity+.2);}}
    this.rebuildNeeded=true;
  }

  rebuildAssemblies(){
    const current=[...this.assemblies.values()];const built=this.builder.build([...this.blocks.values()],current);this.assemblies=new Map(built.map(a=>[a.id,a]));
    for(const a of this.assemblies.values()){
      for(const b of a.blocks)b.assemblyId=a.id;
      for(const e of this.foundation.elements.values()){
        if(!e.assemblyId&&a.bounds&&e.x>=a.bounds.minX-36&&e.x<=a.bounds.maxX+36&&Math.abs(e.y-a.bounds.maxY)<80)e.assemblyId=a.id;
      }
      a.recalculate(this.grid,this.foundation.extraMassesForAssembly(a));
    }
    this.rebuildNeeded=false;this.syncWaterObstacles();
  }

  syncWaterObstacles(){
    const obstacles=[];for(const a of this.assemblies.values()){if(!a.bounds||a.failed&&a.condition<.2)continue;const progress=a.blocks.reduce((s,b)=>s+(b.progress??1),0)/Math.max(1,a.blocks.length);const permeability=a.blocks.reduce((s,b)=>s+(b.permeability??.05),0)/Math.max(1,a.blocks.length);obstacles.push({id:a.id,minX:a.bounds.minX,maxX:a.bounds.maxX,crestElevation:this.engine.water.baseSeaElevation+Math.max(0,(this.engine.water.baseSeaElevation-(720-a.bounds.minY)))*0,topY:a.bounds.minY,progress,permeability});}
    this.engine.water.setStructuralObstacles?.(obstacles);
  }

  estimateBlockPlacement(type,check){
    const candidate=this.findNearestAssembly(check.x,check.y,72);const block=new StructuralBlock({id:"preview-block",type,gridX:check.gridX,gridY:check.gridY,progress:1});
    const a=new StructuralAssembly({id:candidate?.id||"preview-assembly",blocks:[...(candidate?.blocks||[]),block],foundationIds:candidate?.foundationIds||[]});a.recalculate(this.grid,this.foundation.extraMassesForAssembly(a));const result=this.stability.solve(a);
    return {centerOfMass:a.centerOfMass,totalMass:a.totalMass,baseWidth:a.baseWidthMeters,height:a.heightMeters,stability:result.serialize()};
  }

  update(dt,clock){
    const gameHours=dt*(clock?.minutesPerRealSecond||30)/60;this.scheduler.update(gameHours);this.foundation.update(dt);if(this.rebuildNeeded)this.rebuildAssemblies();
    this.accumulator+=dt;if(this.accumulator<.08)return;const elapsed=this.accumulator;this.accumulator=0;
    for(const a of this.assemblies.values()){a.recalculate(this.grid,this.foundation.extraMassesForAssembly(a));this.stability.solve(a);this.failure.update(a,elapsed);}
    this.syncWaterObstacles();
  }

  inspectAt(x,y){
    for(const a of this.assemblies.values()){if(!a.bounds)continue;if(x>=a.bounds.minX-6&&x<=a.bounds.maxX+6&&y>=a.bounds.minY-8&&y<=a.bounds.maxY+8)return this.assemblySnapshot(a);}
    return null;
  }

  assemblySnapshot(a){return {id:a.id,type:"STRUCTURAL_ASSEMBLY",blockCount:a.blocks.length,totalMass:a.totalMass,centerOfMass:{...a.centerOfMass},bounds:a.bounds?{...a.bounds}:null,baseWidth:a.baseWidthMeters,height:a.heightMeters,condition:a.condition,integrity:a.integrity,rotation:a.rotation,displacementX:a.displacementX,failed:a.failed,failureMode:a.failureMode,stability:a.stability,foundations:this.foundation.forAssembly(a.id).map(e=>e.serialize())};}

  snapshot(){return {blocks:[...this.blocks.values()].map(b=>b.serialize()),assemblies:[...this.assemblies.values()].map(a=>this.assemblySnapshot(a)),foundations:this.foundation.serialize(),workforce:this.workforce.snapshot(),jobs:this.queue.serialize().map(j=>({...j,remainingHours:this.queue.get(j.id)?.remainingHours?.()??0})),resources:this.inventory.snapshot(),selectedTool:this.planner.selectedType};}

  serialize(){return {grid:this.grid.serialize(),blocks:[...this.blocks.values()].map(b=>b.serialize()),graph:this.graph.serialize(),assemblies:[...this.assemblies.values()].map(a=>a.serialize()),foundation:this.foundation.serialize(),workforce:this.workforce.serialize(),jobs:this.queue.serialize(),resources:this.inventory.serialize()};}

  hydrate(v={}){
    this.grid.hydrate(v.grid||{});this.blocks.clear();for(const raw of v.blocks||[]){const b=new StructuralBlock(raw);this.blocks.set(b.id,b);}
    this.graph.hydrate(v.graph||[]);this.foundation.hydrate(v.foundation||[]);this.workforce.hydrate(v.workforce||{});this.queue.hydrate(v.jobs||[]);this.inventory.hydrate(v.resources||{});this.rebuildAssemblies();
  }
}
