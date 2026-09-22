import { ConstructionBlueprint } from "./ConstructionBlueprint.js";
import { STRUCTURAL_BLOCKS } from "../../data/structuralBlocks.js";
import { FOUNDATION_TYPES } from "../../data/foundations.js";

export class ConstructionPlanner {
  constructor({validator,structuralSystem}){this.validator=validator;this.structuralSystem=structuralSystem;this.selectedType=null;this.category=null;this.defaultPriority="NORMAL";}
  select(type,category=null,priority="NORMAL"){this.selectedType=type;this.category=category;this.defaultPriority=priority||"NORMAL";}
  clear(){this.selectedType=null;this.category=null;this.defaultPriority="NORMAL";}
  preview(position){
    if(!this.selectedType)return null;
    const check=this.validator.validate(this.selectedType,position);
    if(!check.valid)return check;
    const estimate=STRUCTURAL_BLOCKS[this.selectedType]?this.structuralSystem.estimateBlockPlacement(this.selectedType,check):null;
    return {...check,estimate};
  }
  plan(position,{priority=this.defaultPriority,desiredWorkers=null}={}){
    if(!this.selectedType)return {ok:false,reason:"Nenhuma ferramenta estrutural selecionada"};
    const check=this.validator.validate(this.selectedType,position);if(!check.valid)return {ok:false,...check};
    const isBlock=Boolean(STRUCTURAL_BLOCKS[this.selectedType]),isFoundation=Boolean(FOUNDATION_TYPES[this.selectedType]);
    const targetAssembly=this.structuralSystem.findNearestAssembly(check.x,check.y,64);
    const blueprint=new ConstructionBlueprint({
      kind:isBlock?"BLOCK":isFoundation?"FOUNDATION":"BLOCK",
      type:this.selectedType,position:{x:check.x,y:check.y},gridX:check.gridX,gridY:check.gridY,
      targetAssemblyId:targetAssembly?.id||null,cost:check.cost,materials:check.materials,
      workersRequired:check.workersRequired,laborHours:check.laborHours,requiredEquipment:check.requiredEquipment,
      priority,metadata:{soil:check.soil}
    });
    return this.structuralSystem.scheduleBlueprint(blueprint,{desiredWorkers});
  }
}
