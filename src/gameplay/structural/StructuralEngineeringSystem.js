import { StructuralGrid } from "./StructuralGrid.js";
import { StructuralBlock } from "./StructuralBlock.js";
import { AssemblyGraph } from "./AssemblyGraph.js";
import { BlockConnectionSystem } from "./BlockConnectionSystem.js";
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
    this.connectionSystem=new BlockConnectionSystem({graph:this.graph,grid:this.grid,blocks:this.blocks});
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
      this.connectionSystem.connectBlock(block);
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
    this.planner.select(type,"FOUNDATION",options.priority||"HIGH");
    const result=this.planner.plan(position,{priority:options.priority||"HIGH",desiredWorkers:options.workers});
    this.planner.clear();
    if(result.ok&&result.job){result.job.type="REINFORCE";result.job.targetAssemblyId=assemblyId;result.job.blueprint.targetAssemblyId=assemblyId;}
    return result;
  }

  cancelJob(jobId){
    const job=this.queue.get(jobId);if(!job)return false;
    const ok=this.scheduler.cancel(jobId);if(!ok)return false;
    if(job.blueprint?.blockId){const block=this.blocks.get(job.blueprint.blockId);if(block){this.grid.releaseBlock(block.id);this.graph.removeForBlock(block.id);this.blocks.delete(block.id);}}
    if(job.blueprint?.foundationId){const id=job.blueprint.foundationId;this.grid.releaseFoundation(id);this.foundation.elements.delete(id);}
    this.rebuildAssemblies();return true;
  }

  onProgress(job){
    if(job.blueprint?.blockId){const b=this.blocks.get(job.blueprint.blockId);if(b){b.progress=job.progress;b.constructionState=job.state;}}
    if(job.blueprint?.foundationId){const e=this.foundation.elements.get(job.blueprint.foundationId);if(e){e.progress=job.progress;e.constructionState=job.state;}}
    if(job.type==="REPAIR"){const a=this.assemblies.get(job.targetId);if(a)a.condition=Math.min(1,a.condition+job.assignedWorkers*.00005);}
    this.rebuildNeeded=true;
  }

  onComplete(job){
    if(job.blueprint?.blockId){const b=this.blocks.get(job.blueprint.blockId);if(b){b.progress=1;b.constructionState="COMPLETED";this.eventBus?.emit("structural:block-completed",{block:b});}}
    if(job.blueprint?.foundationId){const e=this.foundation.elements.get(job.blueprint.foundationId);if(e){e.progress=1;e.constructionState="COMPLETED";this.eventBus?.emit("foundation:completed",{foundation:e,job});}}
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
    const obstacles=[];
    for(const a of this.assemblies.values()){
      if(!a.bounds||(a.failed&&a.condition<.2))continue;
      const hydraulicBlocks=a.blocks.filter(b=>b.type!=="PORTABLE_PUMP");
      if(!hydraulicBlocks.length)continue;
      const progress=hydraulicBlocks.reduce((s,b)=>s+(b.progress??1),0)/hydraulicBlocks.length;
      const permeability=hydraulicBlocks.reduce((s,b)=>s+(b.permeability??.05),0)/hydraulicBlocks.length;
      obstacles.push({id:a.id,minX:a.bounds.minX,maxX:a.bounds.maxX,topY:a.bounds.minY,progress,permeability});
    }
    this.engine.water.setStructuralObstacles?.(obstacles);
  }

  updatePumps(dt){
    const water=this.engine.water;
    for(const block of this.blocks.values()){
      if(block.type!=="PORTABLE_PUMP"||block.progress<1||block.integrity<=0)continue;
      const p=block.worldCenter(this.grid),i=Math.max(0,Math.min(water.n-1,Math.floor(p.x/water.dx)));
      if(water.h[i]<=.05)continue;
      const capacity=(block.pumpCapacity||1.6)*48*dt*.18;
      const removed=Math.min(water.h[i],capacity);water.h[i]-=removed;
      water.h[Math.max(0,i-30)]+=removed*.96;
    }
  }

  degradeConnections(a,dt){
    if(!a.stability)return;
    const ids=new Set(a.blocks.map(b=>b.id));
    const stress=Math.max(0,1.2-a.stability.minimumFactor);
    if(stress<=0)return;
    let broken=false;
    for(const [id,connection] of this.graph.connections){
      if(!ids.has(connection.a)||!ids.has(connection.b))continue;
      const resistance=Math.max(.15,connection.strength||.2);
      connection.integrity=Math.max(0,connection.integrity-dt*stress*.08/resistance);
      if(connection.integrity<=.05){
        this.graph.connections.delete(id);broken=true;
        this.eventBus?.emit("structural:connection-failed",{assemblyId:a.id,connectionId:id});
      }
    }
    if(broken)this.rebuildNeeded=true;
  }

  updateFoundationLoads(a,dt){
    if(!a.stability)return;
    const critical=Math.max(0,1.1-Math.min(a.stability.sliding.factor,a.stability.overturning.factor,a.stability.uplift.factor));
    if(critical<=0)return;
    for(const e of this.foundation.forAssembly(a.id)){
      if(!["ANCHOR","TIEBACK","PILE"].includes(e.kind))continue;
      const before=e.integrity;
      e.integrity=Math.max(0,e.integrity-dt*critical*(e.kind==="PILE"?.002:.0035));
      if(before>0&&e.integrity<=0){
        this.eventBus?.emit("structural:foundation-failed",{assemblyId:a.id,foundationId:e.id,mode:e.kind==="PILE"?"PILE_FAILURE":"ANCHOR_FAILURE"});
      }
    }
  }

  fractureAssembly(a){
    const candidates=a.blocks.filter(b=>b.gridY<Math.max(...a.blocks.map(x=>x.gridY)));
    const detached=candidates.filter((b,index)=>index%2===0).slice(0,Math.max(1,Math.ceil(candidates.length*.35)));
    for(const block of detached){
      const p=block.worldCenter(this.grid);
      this.engine.rigidBodies?.spawn?.(p.x,p.y,block.width*48,block.height*48,block.density||2200,block.type==="GABION"?"rock":"concrete");
      this.grid.releaseBlock(block.id);this.graph.removeForBlock(block.id);this.blocks.delete(block.id);
    }
    if(detached.length)this.rebuildNeeded=true;
  }

  estimateBlockPlacement(type,check){
    const candidate=this.findNearestAssembly(check.x,check.y,72);const block=new StructuralBlock({id:"preview-block",type,gridX:check.gridX,gridY:check.gridY,progress:1});
    const a=new StructuralAssembly({id:candidate?.id||"preview-assembly",blocks:[...(candidate?.blocks||[]),block],foundationIds:candidate?.foundationIds||[]});a.recalculate(this.grid,this.foundation.extraMassesForAssembly(a));const result=this.stability.solve(a);
    return {centerOfMass:a.centerOfMass,totalMass:a.totalMass,baseWidth:a.baseWidthMeters,height:a.heightMeters,stability:result.serialize()};
  }

  update(dt,clock){
    const gameHours=dt*(clock?.minutesPerRealSecond||30)/60;this.scheduler.update(gameHours);this.foundation.update(dt);if(this.rebuildNeeded)this.rebuildAssemblies();
    this.accumulator+=dt;if(this.accumulator<.08)return;const elapsed=this.accumulator;this.accumulator=0;
    for(const a of this.assemblies.values()){
      a.recalculate(this.grid,this.foundation.extraMassesForAssembly(a));
      this.stability.solve(a);
      this.degradeConnections(a,elapsed);
      this.updateFoundationLoads(a,elapsed);
      if(a.stability.minimumFactor<1){
        const damage=(1-a.stability.minimumFactor)*elapsed*.0015;
        for(const block of a.blocks)block.integrity=Math.max(0,block.integrity-damage);
      }
      const wasFailed=a.failed;
      this.failure.update(a,elapsed);
      if(!wasFailed&&a.failed)this.fractureAssembly(a);
    }
    if(this.rebuildNeeded)this.rebuildAssemblies();
    this.updatePumps(elapsed);
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
