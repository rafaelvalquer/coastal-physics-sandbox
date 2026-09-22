import test from "node:test";
import assert from "node:assert/strict";
import { TerrainGrid } from "../../src/engine/world/TerrainGrid.js";
import { AtmosphereSystem } from "../../src/engine/physics/AtmosphereSystem.js";
import { ParticleSystem } from "../../src/engine/particles/ParticleSystem.js";
import { WaterSolver } from "../../src/engine/physics/WaterSolver.js";
import { RigidBodySystem } from "../../src/engine/physics/RigidBodySystem.js";
import { BuildingManager } from "../../src/gameplay/buildings/BuildingManager.js";
import { BuildingStructuralSystem } from "../../src/gameplay/buildings/BuildingStructuralSystem.js";
import { EventBus } from "../../src/core/EventBus.js";

function fixture(){
 const terrain=new TerrainGrid(),particles=new ParticleSystem(),atmosphere=new AtmosphereSystem(),water=new WaterSolver(terrain,atmosphere,particles),rigidBodies=new RigidBodySystem(),eventBus=new EventBus(),buildings=new BuildingManager(eventBus);
 const engine={terrain,water,rigidBodies,fluidStructureCoupler:null};
 const system=new BuildingStructuralSystem({engine,buildingManager:buildings,eventBus});
 return {terrain,water,rigidBodies,eventBus,buildings,system};
}

test("casa nasce como StructuralAssembly composta por fundação, paredes e cobertura",()=>{
 const f=fixture(),x=900,y=f.terrain.columnTopWorldYAt(x),building=f.buildings.add({id:"house-test",type:"HOUSE",x,y});
 const assembly=f.system.ensureAssembly(building);
 assert.ok(assembly);
 assert.equal(building.structuralAssemblyId,assembly.id);
 assert.ok(assembly.blocks.length>=4);
 const types=new Set(assembly.blocks.map(b=>b.type));
 assert.ok(types.has("LIGHT_FOOTING"));
 assert.ok(types.has("WOOD_FRAME"));
 assert.ok(types.has("ROOF_PANEL"));
 assert.equal(assembly.buildingId,building.id);
});

test("colapso estrutural cai antes de fraturar e gera debris rígido",()=>{
 const f=fixture(),x=900,y=f.terrain.columnTopWorldYAt(x),building=f.buildings.add({id:"collapse-test",type:"HOUSE",x,y}),assembly=f.system.ensureAssembly(building);
 assert.equal(f.system.forceBuildingCollapse(building.id,"DAMAGE"),true);
 assert.equal(assembly.collapseState,"FALLING");
 for(let i=0;i<150&&!assembly.fractured;i++)f.system.update(1/120);
 assert.equal(assembly.fractured,true);
 const debris=f.rigidBodies.bodies.filter(b=>b.sourceAssemblyId===assembly.id);
 assert.ok(debris.length>=4&&debris.length<=8);
 assert.equal(building.operational,false);
});
