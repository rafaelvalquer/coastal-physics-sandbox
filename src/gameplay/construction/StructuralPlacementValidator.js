import { STRUCTURAL_BLOCKS } from "../../data/structuralBlocks.js";
import { FOUNDATION_TYPES } from "../../data/foundations.js";

export class StructuralPlacementValidator {
  constructor({grid,terrain,buildings,inventory,structuralSystem}){Object.assign(this,{grid,terrain,buildings,inventory,structuralSystem});}
  config(type){return STRUCTURAL_BLOCKS[type]||FOUNDATION_TYPES[type]||null;}
  resolve(type,position){
    const cfg=this.config(type);if(!cfg)return null;
    const raw=this.grid.snapWorld(position.x,position.y);
    if(STRUCTURAL_BLOCKS[type]){
      const groundY=this.terrain.columnTopWorldYAt(raw.x);
      let gridY=raw.gridY;
      if(Math.abs(position.y-groundY)<=this.grid.cellSize*1.5) gridY=this.grid.worldToCell(raw.x,groundY-this.grid.cellSize*.5).y;
      const world=this.grid.cellToWorld(raw.gridX,gridY);
      return {...world,gridX:raw.gridX,gridY,groundY};
    }
    const groundY=this.terrain.columnTopWorldYAt(raw.x);
    const groundCell=this.grid.worldToCell(raw.x,Math.max(0,groundY-this.grid.cellSize*.5));
    const world=this.grid.cellToWorld(raw.gridX,groundCell.y);
    return {...world,y:groundY,gridX:raw.gridX,gridY:groundCell.y,groundY};
  }
  validate(type,position){
    const cfg=this.config(type);if(!cfg)return {valid:false,reason:"Ferramenta desconhecida"};
    const resolved=this.resolve(type,position);if(!resolved)return {valid:false,reason:"Posição inválida"};
    const requirements={cost:cfg.moneyCost||cfg.materialCost||0,materials:cfg.materials||{},requiredEquipment:cfg.requiredEquipment||[]};
    const resource=this.inventory.canPlan(requirements);if(!resource.ok)return {valid:false,reason:resource.reason,...resolved,...requirements};
    const nearBuilding=this.buildings?.near?.(resolved.x,resolved.y,28)?.some(b=>Math.abs(b.x-resolved.x)<b.width/2+14&&resolved.y>b.y-b.height-20&&resolved.y<b.y+20);
    if(nearBuilding)return {valid:false,reason:"Colisão com edificação",...resolved,...requirements};

    if(STRUCTURAL_BLOCKS[type]){
      if(this.grid.isOccupied(resolved.gridX,resolved.gridY))return {valid:false,reason:"Célula ocupada",...resolved,...requirements};
      const below=this.grid.getCell(resolved.gridX,resolved.gridY+1);
      const blockBottom=resolved.y+cfg.height*24;
      const groundContact=Math.abs(blockBottom-resolved.groundY)<=this.grid.cellSize*.85;
      const supported=groundContact||Boolean(below?.blockId||below?.foundationId);
      if(!supported)return {valid:false,reason:"Bloco sem apoio: construa sobre o solo, fundação ou outro bloco",...resolved,...requirements};
    }

    const soilCell=this.terrain.worldToCell(resolved.x,Math.min(this.terrain.rows*this.terrain.cellSize-1,resolved.groundY+2));
    const idx=this.terrain.index(soilCell.x,soilCell.y);
    const material=this.terrain.getMaterial(soilCell.x,soilCell.y)?.name||"Desconhecido";
    const moisture=this.terrain.moisture[idx]||0;
    return {valid:true,reason:null,...resolved,...requirements,workersRequired:cfg.workersRequired||2,laborHours:cfg.laborHours||1,soil:{material,moisture,groundY:resolved.groundY},config:cfg};
  }
}
