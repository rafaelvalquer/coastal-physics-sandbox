import { StructuralGrid } from "../structural/StructuralGrid.js";
import { StructuralBlock } from "../structural/StructuralBlock.js";
import { StructuralAssembly } from "../structural/StructuralAssembly.js";
import { AssemblyGraph } from "../structural/AssemblyGraph.js";
import { StructuralFoundationSystem } from "../foundation/StructuralFoundationSystem.js";
import { StabilitySolver } from "../structural/StabilitySolver.js";
import { StructuralFailureSystem } from "../structural/StructuralFailureSystem.js";

const PX=48;

function profileFor(type){
  if(type==="HOUSE")return {columns:1,stories:1,wall:"WOOD_FRAME",critical:false};
  if(type==="WAREHOUSE"||type==="PORT")return {columns:2,stories:1,wall:"PRECAST_WALL",critical:type==="PORT"};
  if(type==="BUILDING")return {columns:2,stories:2,wall:"PRECAST_WALL",critical:false};
  return {columns:2,stories:2,wall:"PRECAST_WALL",critical:["HOSPITAL","POWER_PLANT","CITY_HALL"].includes(type)};
}

export class BuildingStructuralSystem{
 constructor({engine,buildingManager,eventBus}){
  Object.assign(this,{engine,buildingManager,eventBus});
  this.grid=new StructuralGrid();
  this.blocks=new Map();
  this.graph=new AssemblyGraph();
  this.assemblies=new Map();
  this.buildingToAssembly=new Map();
  this.foundation=new StructuralFoundationSystem({terrain:engine.terrain,water:engine.water,grid:this.grid,eventBus});
  this.stability=new StabilitySolver({water:engine.water,foundation:this.foundation,fluidStructureCoupler:engine.fluidStructureCoupler});
  this.failure=new StructuralFailureSystem({eventBus,rigidBodies:engine.rigidBodies,grid:this.grid,graph:this.graph,terrain:engine.terrain,water:engine.water});
  this.destroyedBuildings=new Set();
  this.bindEvents();
 }

 bindEvents(){
  this.eventBus?.on("building:damaged",({buildingId,damage,cause})=>this.applyBuildingDamage(buildingId,damage,cause));
  this.eventBus?.on("building:destroyed",({buildingId,cause})=>this.forceBuildingCollapse(buildingId,cause||"DAMAGE"));
  this.eventBus?.on("structural:fractured",({buildingId})=>{if(buildingId)this.onFractured(buildingId);});
 }

 clear(){
  this.blocks.clear();this.graph.connections.clear();this.assemblies.clear();this.buildingToAssembly.clear();this.foundation.elements.clear();this.foundation.grid.cells.clear();this.destroyedBuildings.clear();
 }

 rebuildAll(){
  this.clear();
  for(const building of this.buildingManager.list())this.ensureAssembly(building);
 }

 addBlock({building,type,gridX,gridY}){
  const block=new StructuralBlock({type,gridX,gridY,buildingId:building.id,constructionState:"COMPLETED",progress:1});
  this.blocks.set(block.id,block);
  return block;
 }

 connect(a,b,type="MORTAR"){
  const c=this.graph.connect(a.id,b.id,type);
  c.integrity=1;
  return c;
 }

 ensureAssembly(building){
  if(!building||this.buildingToAssembly.has(building.id))return this.assemblies.get(this.buildingToAssembly.get(building?.id));
  const profile=profileFor(building.type),base=this.grid.worldToCell(building.x,Math.max(0,building.y-4)),startX=base.x-Math.floor((profile.columns-1)/2),blocks=[],columns=[];

  for(let col=0;col<profile.columns;col++){
    const gx=Math.max(0,Math.min(this.grid.cols-1,startX+col));
    const footing=this.addBlock({building,type:"LIGHT_FOOTING",gridX:gx,gridY:base.y});blocks.push(footing);
    const firstWall=this.addBlock({building,type:profile.wall,gridX:gx,gridY:Math.max(1,base.y-1)});blocks.push(firstWall);
    let previous=footing;this.connect(previous,firstWall,profile.wall==="WOOD_FRAME"?"REINFORCED":"MORTAR");previous=firstWall;
    if(profile.stories>1){
      const slab=this.addBlock({building,type:"FLOOR_SLAB",gridX:gx,gridY:Math.max(1,base.y-3)});blocks.push(slab);this.connect(previous,slab,"REINFORCED");previous=slab;
      const upper=this.addBlock({building,type:"PRECAST_WALL",gridX:gx,gridY:Math.max(1,base.y-4)});blocks.push(upper);this.connect(previous,upper,"MORTAR");previous=upper;
      const roof=this.addBlock({building,type:"ROOF_PANEL",gridX:gx,gridY:Math.max(1,base.y-6)});blocks.push(roof);this.connect(previous,roof,"REINFORCED");
    }else{
      const upper=profile.wall==="WOOD_FRAME"?this.addBlock({building,type:"WOOD_FRAME",gridX:gx,gridY:Math.max(1,base.y-3)}):null;
      if(upper){blocks.push(upper);this.connect(previous,upper,"REINFORCED");previous=upper;}
      const roof=this.addBlock({building,type:"ROOF_PANEL",gridX:gx,gridY:Math.max(1,base.y-(upper?5:3))});blocks.push(roof);this.connect(previous,roof,"REINFORCED");
    }
    columns.push(blocks.filter(b=>b.gridX===gx));
  }

  if(profile.columns>1){
    const byLevel=new Map();
    for(const block of blocks){const key=block.gridY+":"+block.type;if(!byLevel.has(key))byLevel.set(key,[]);byLevel.get(key).push(block);}
    for(const level of byLevel.values())if(level.length>1)for(let i=1;i<level.length;i++)this.connect(level[i-1],level[i],level[i].type==="ROOF_PANEL"||level[i].type==="FLOOR_SLAB"?"REINFORCED":"MORTAR");
  }

  const assembly=new StructuralAssembly({id:"building-assembly-"+building.id,blocks,condition:building.integrityRatio});
  assembly.buildingId=building.id;
  for(const block of blocks)block.assemblyId=assembly.id;
  assembly.recalculate(this.grid);

  const dx=building.x-assembly.centerOfMass.x;
  const desiredBottom=building.y-2;
  const dy=desiredBottom-(assembly.bounds?.maxY||building.y);
  for(const block of blocks){block.displacementX+=dx;block.displacementY+=dy;}
  assembly.recalculate(this.grid);

  if(profile.critical){
    const pileY=building.y;
    for(let col=0;col<profile.columns;col++){
      const x=assembly.bounds.minX+(col+.5)*(assembly.bounds.maxX-assembly.bounds.minX)/profile.columns;
      const pile=this.foundation.create({type:"DEEP_PILE",x,y:pileY,assemblyId:assembly.id});
      assembly.foundationIds.push(pile.id);
    }
  }else if(building.type!=="HOUSE"){
    const pile=this.foundation.create({type:"SHALLOW_PILE",x:building.x,y:building.y,assemblyId:assembly.id});
    assembly.foundationIds.push(pile.id);
  }

  assembly.recalculate(this.grid,this.foundation.extraMassesForAssembly(assembly));
  this.assemblies.set(assembly.id,assembly);this.buildingToAssembly.set(building.id,assembly.id);
  building.structuralAssemblyId=assembly.id;building.structuralState="STABLE";building.structuralIntegrity=assembly.integrity;building.structuralBounds=assembly.bounds;
  return assembly;
 }

 assemblyForBuilding(id){const aid=this.buildingToAssembly.get(id);return aid?this.assemblies.get(aid):null;}

 applyBuildingDamage(buildingId,damage,cause="ENVIRONMENT"){
  const building=this.buildingManager.get(buildingId),assembly=this.assemblyForBuilding(buildingId);if(!building||!assembly||assembly.fractured)return;
  const normalized=Math.max(0,Number(damage)||0)/Math.max(1,building.maxIntegrity);
  for(const block of assembly.blocks){
    const vulnerability=block.type==="ROOF_PANEL"?1.35:block.type==="WOOD_FRAME"?1.2:block.type==="LIGHT_FOOTING"?0.55:0.85;
    block.integrity=Math.max(.02,block.integrity-normalized*vulnerability);
  }
  const ids=new Set(assembly.blocks.map(b=>b.id));
  for(const connection of this.graph.connections.values())if(ids.has(connection.a)&&ids.has(connection.b))connection.integrity=Math.max(0,connection.integrity-normalized*.9);
  assembly.condition=Math.max(0,assembly.condition-normalized*.8);assembly.recalculate(this.grid,this.foundation.extraMassesForAssembly(assembly));
  if(building.integrityRatio<.18||assembly.integrity<.28)this.failure.forceFailure(assembly,cause==="FOUNDATION"?"FOUNDATION_FAILURE":"DAMAGE",Math.min(1,.45+normalized*5));
 }

 forceBuildingCollapse(buildingId,cause="DAMAGE"){
  const assembly=this.assemblyForBuilding(buildingId);if(!assembly)return false;return this.failure.forceFailure(assembly,cause==="FOUNDATION"?"FOUNDATION_FAILURE":"DAMAGE",1);
 }

 onFractured(buildingId){
  const building=this.buildingManager.get(buildingId);if(!building||this.destroyedBuildings.has(buildingId))return;
  this.destroyedBuildings.add(buildingId);building.integrity=0;building.operational=false;building.structuralState="FRACTURED";
  this.eventBus?.emit("building:structural-collapse",{buildingId,assemblyId:building.structuralAssemblyId,position:{x:building.x,y:building.y}});
 }

 update(dt){
  this.foundation.update(dt);
  for(const assembly of this.assemblies.values()){
    const building=this.buildingManager.get(assembly.buildingId);if(!building)continue;
    assembly.recalculate(this.grid,this.foundation.extraMassesForAssembly(assembly));
    if(!assembly.failed&&!assembly.fractured)this.stability.solve(assembly);
    this.failure.update(assembly,dt);
    assembly.recalculate(this.grid,this.foundation.extraMassesForAssembly(assembly));
    building.structuralState=assembly.collapseState;
    building.structuralIntegrity=assembly.integrity;
    building.structuralBounds=assembly.bounds;
    building.rotation=assembly.rotation;
    building.displacementX=assembly.displacementX;
    building.displacementY=assembly.displacementY;
    if(!assembly.fractured){
      const structuralRatio=Math.max(0,Math.min(1,assembly.integrity*assembly.condition));
      if(structuralRatio<building.integrityRatio)building.integrity=Math.max(0,building.maxIntegrity*structuralRatio);
    }
  }
 }

 serialize(){
  return {
   blocks:[...this.blocks.values()].map(b=>b.serialize()),
   assemblies:[...this.assemblies.values()].map(a=>a.serialize()),
   graph:this.graph.serialize(),
   foundation:this.foundation.serialize(),
   buildingToAssembly:[...this.buildingToAssembly.entries()],
   destroyedBuildings:[...this.destroyedBuildings]
  };
 }

 hydrate(value={}){
  this.clear();
  for(const raw of value.blocks||[]){const block=new StructuralBlock(raw);this.blocks.set(block.id,block);}
  this.graph.hydrate(value.graph||[]);
  this.foundation.hydrate(value.foundation||[]);
  for(const raw of value.assemblies||[]){
   const blocks=(raw.blockIds||[]).map(id=>this.blocks.get(id)).filter(Boolean);
   const assembly=new StructuralAssembly({...raw,blocks});
   Object.assign(assembly,raw);
   assembly.blocks=blocks;
   assembly.recalculate(this.grid,this.foundation.extraMassesForAssembly(assembly));
   this.assemblies.set(assembly.id,assembly);
  }
  this.buildingToAssembly=new Map(value.buildingToAssembly||[]);
  this.destroyedBuildings=new Set(value.destroyedBuildings||[]);
  for(const building of this.buildingManager.list()){
   const assembly=this.assemblyForBuilding(building.id);
   if(assembly){building.structuralAssemblyId=assembly.id;building.structuralState=assembly.collapseState;building.structuralBounds=assembly.bounds;}
   else this.ensureAssembly(building);
  }
 }

 snapshot(){return {assemblies:[...this.assemblies.values()].map(a=>a.serialize()),blockCount:this.blocks.size,failed:[...this.assemblies.values()].filter(a=>a.failed).length,fractured:[...this.assemblies.values()].filter(a=>a.fractured).length,debris:this.engine.rigidBodies.bodies.filter(b=>b.sourceAssemblyId).length};}
}
