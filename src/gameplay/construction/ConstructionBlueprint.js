let sequence=1;
export class ConstructionBlueprint {
  constructor({id,kind="BLOCK",type,position,gridX,gridY,targetAssemblyId=null,targetId=null,cost=0,materials={},workersRequired=2,laborHours=1,requiredEquipment=[],priority="NORMAL",metadata={}}={}){
    this.id=id||"blueprint-"+sequence++;this.kind=kind;this.type=type;this.position=position;this.gridX=gridX;this.gridY=gridY;this.targetAssemblyId=targetAssemblyId;this.targetId=targetId;this.cost=cost;this.materials={...materials};this.workersRequired=workersRequired;this.laborHours=laborHours;this.requiredEquipment=[...requiredEquipment];this.priority=priority;this.metadata={...metadata};
  }
  requirements(){return {cost:this.cost,materials:this.materials,requiredEquipment:this.requiredEquipment};}
  serialize(){return JSON.parse(JSON.stringify(this));}
}
