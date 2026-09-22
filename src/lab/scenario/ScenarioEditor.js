import { MATERIALS } from "../../engine/world/materials.js";
import { BUILDING_TYPES } from "../../data/buildings.js";
import { CONSTRUCTION_TYPES } from "../../data/constructions.js";
import { ScenarioSerializer } from "./ScenarioSerializer.js";

export class ScenarioEditor{
 constructor({engine,buildings,constructions,eventBus}){
  Object.assign(this,{engine,buildings,constructions,eventBus});this.activeCategory="INSPECT";this.activeTool="INSPECT";this.brush=2;this.dragStart=null;this.dragCurrent=null;this.sequence=1;this.roads=[];this.spent=0;this.usedTools=new Set();this.budgetLimit=null;this.template=null;this.seed=48212;
 }
 select(category,tool){this.activeCategory=category;this.activeTool=tool;this.dragStart=null;this.dragCurrent=null;}
 clearTool(){this.select("INSPECT","INSPECT");}
 setBudget(limit){this.budgetLimit=limit==null?null:Number(limit);this.spent=0;}
 canSpend(cost){return this.budgetLimit==null||this.spent+cost<=this.budgetLimit;}
 clearScene(){this.buildings.items.clear();this.buildings.reindex();this.constructions.items.clear();this.constructions.physicsAdapter.snapshots.clear();this.constructions.physicsAdapter.drains.clear();this.constructions.physicsAdapter.footprints.clear();this.roads=[];this.spent=0;this.usedTools.clear();}
 shapeColumn(col,targetY,material=MATERIALS.SOIL){
  const t=this.engine.terrain,row=Math.max(1,Math.min(t.rows-1,Math.floor(targetY/t.cellSize))),top=t.columnTopCell(col);
  if(row<top){for(let y=row;y<top;y++)t.setCell(col,y,material.id,1,.18);}
  else if(row>top){for(let y=top;y<row;y++)t.setCell(col,y,MATERIALS.AIR.id,0,0);}
 }
 applyTerrainPreset(preset){
  const t=this.engine.terrain;t.generateIsland(this.seed);
  for(let col=0;col<t.cols;col++){const x=(col+.5)*t.cellSize;
   if(preset==="LOW"&&x>=610&&x<=1160)this.shapeColumn(col,421+Math.sin(x*.022)*3,MATERIALS.SOIL);
   else if(preset==="HARBOR"&&x>=600&&x<=1120)this.shapeColumn(col,x<760?426:375,MATERIALS.CONCRETE);
   else if(preset==="CLIFF"&&x>=590&&x<=1120)this.shapeColumn(col,300+Math.sin(x*.015)*5,MATERIALS.ROCK);
   else if(preset==="RIVER"&&x>=805&&x<=875)this.shapeColumn(col,470+Math.abs(x-840)*.35,MATERIALS.SAND);
  }
  this.engine.water.refreshBed();this.engine.water.resetWater();this.engine.surfaceWaves.displacement.fill(0);this.engine.surfaceWaves.velocity.fill(0);
 }
 applyTemplate(id){
  const template=ScenarioSerializer.get(id);this.clearScene();this.applyTerrainPreset(template.terrainPreset);this.template=template;
  for(const raw of template.buildings){const y=this.engine.terrain.columnTopWorldYAt(raw.x);const b=this.buildings.add({...raw,y});b.occupants=Math.max(0,Math.min(b.capacity,raw.occupants??b.capacity));}
  for(const d of template.defenses||[]){const y=this.engine.terrain.columnTopWorldYAt(d.x);this.constructions.place({...d,y});}
  this.roads=structuredClone(template.roads||[]);this.engine.water.refreshBed();this.eventBus?.emit("lab:template-applied",{template:template.id});return template;
 }
 applyTerrainTool(x,y){
  const t=this.engine.terrain,c=t.worldToCell(x,y),r=this.brush,tool=this.activeTool;
  for(let dx=-r;dx<=r;dx++){if(Math.abs(dx)>r)continue;const col=Math.max(0,Math.min(t.cols-1,c.x+dx)),top=t.columnTopCell(col);if(top>=t.rows)continue;
   if(tool==="RAISE")this.shapeColumn(col,(top-1)*t.cellSize,t.getMaterial(col,top));
   else if(tool==="LOWER")this.shapeColumn(col,(top+1)*t.cellSize,t.getMaterial(col,top));
   else if(tool==="SMOOTH"){const l=t.columnTopCell(Math.max(0,col-1)),rr=t.columnTopCell(Math.min(t.cols-1,col+1)),avg=(l+top+rr)/3;this.shapeColumn(col,avg*t.cellSize,t.getMaterial(col,top));}
   else if(["SAND","SOIL","ROCK","CLAY","GRAVEL","CONCRETE"].includes(tool)){const mat=MATERIALS[tool];t.setCell(col,top,mat.id,1,tool==="SAND"?.25:.08);}
   else if(tool==="SATURATE"||tool==="DRY"){for(let yy=top;yy<Math.min(t.rows,top+12);yy++){const idx=t.index(col,yy);if(t.getMaterial(col,yy).solid)t.moisture[idx]=tool==="SATURATE"?1:0;}}
  }
  t.age?.fill?.(0);this.engine.water.refreshBed();this.usedTools.add(tool);this.eventBus?.emit("lab:terrain-edited",{tool,x,y});
 }
 placeBuilding(type,x){
  if(!BUILDING_TYPES[type])return {ok:false,reason:"Edificação desconhecida"};const cfg=BUILDING_TYPES[type],cost=cfg.constructionCost||0;if(!this.canSpend(cost))return {ok:false,reason:"Orçamento do desafio excedido"};
  const y=this.engine.terrain.columnTopWorldYAt(x),id=type.toLowerCase()+"-"+this.sequence++,b=this.buildings.add({id,type,x,y});b.occupants=Math.max(0,Math.min(b.capacity,b.capacity));this.spent+=cost;this.usedTools.add(type);return {ok:true,building:b,cost};
 }
 placeRoad(start,end){const id="road-"+this.sequence++,length=Math.abs(end.x-start.x),cost=length*25;if(!this.canSpend(cost))return {ok:false,reason:"Orçamento do desafio excedido"};const road={id,x1:start.x,y1:start.y,x2:end.x,y2:end.y};this.roads.push(road);this.spent+=cost;this.usedTools.add("ROAD");return {ok:true,road,cost};}
 placeDefense(type,start,end){
  const cfg=CONSTRUCTION_TYPES[type];if(!cfg)return {ok:false,reason:"Defesa desconhecida"};const distance=Math.max(48,Math.hypot(end.x-start.x,end.y-start.y)),length=Math.max(4,distance/12),x=(start.x+end.x)/2,y=this.engine.terrain.columnTopWorldYAt(x),cost=cfg.costPerMeter*length;if(!this.canSpend(cost))return {ok:false,reason:"Orçamento do desafio excedido",cost};
  const result=this.constructions.place({type,x,y,length});if(result.ok){this.spent+=result.cost||cost;this.usedTools.add(type);}return result;
 }
 pointerDown(x,y){
  if(this.activeCategory==="TERRAIN"){this.applyTerrainTool(x,y);return {ok:true};}
  if(this.activeCategory==="CITY"&&this.activeTool!=="ROAD")return this.placeBuilding(this.activeTool,x);
  if(["DEFENSE","WATER"].includes(this.activeCategory)||this.activeTool==="ROAD"){this.dragStart={x,y};this.dragCurrent={x,y};return {ok:true,drag:true};}
  return null;
 }
 pointerMove(x,y){if(this.activeCategory==="TERRAIN")this.applyTerrainTool(x,y);if(this.dragStart)this.dragCurrent={x,y};}
 carveChannel(start,end){const t=this.engine.terrain,minX=Math.min(start.x,end.x),maxX=Math.max(start.x,end.x),length=Math.max(24,maxX-minX),cost=length*18;if(!this.canSpend(cost))return {ok:false,reason:"Orçamento do desafio excedido"};for(let x=minX;x<=maxX;x+=t.cellSize){const col=t.worldToCell(x,0).x,top=t.columnTopCell(col);if(top>=t.rows)continue;this.shapeColumn(col,(top+2)*t.cellSize,MATERIALS.SAND);}this.engine.water.refreshBed();this.spent+=cost;this.usedTools.add("CHANNEL");return {ok:true,cost};}
 pointerUp(x,y){if(!this.dragStart)return null;const start=this.dragStart,end={x,y};this.dragStart=null;this.dragCurrent=null;if(this.activeTool==="ROAD")return this.placeRoad(start,end);if(this.activeTool==="CHANNEL")return this.carveChannel(start,end);return this.placeDefense(this.activeTool,start,end);}
 snapshot(){return {category:this.activeCategory,tool:this.activeTool,brush:this.brush,dragStart:this.dragStart,dragCurrent:this.dragCurrent,template:this.template?.id||null,seed:this.seed,spent:this.spent,budgetLimit:this.budgetLimit,usedTools:[...this.usedTools],roads:structuredClone(this.roads)};}
}
