import { CoastalConstruction } from "./CoastalConstruction.js";
export class ConstructionManager {
 constructor({eventBus,budget,validator,physicsAdapter}){Object.assign(this,{eventBus,budget,validator,physicsAdapter});this.items=new Map();this.sequence=1;}
 place({type,x,y,length=10}){ const check=this.validator?.validate(type,{x,y},length)||{valid:true,cost:0}; if(!check.valid)return {ok:false,...check}; if(this.budget&&!this.budget.spend(check.cost,"CONSTRUCTION",type))return {ok:false,reason:"Orçamento insuficiente"}; const c=new CoastalConstruction({id:"coastal-"+this.sequence++,type,x,y,length}); this.items.set(c.id,c); this.applyPhysicalEffect(c); this.eventBus?.emit("construction:placed",{construction:c,cost:check.cost}); return {ok:true,construction:c,cost:check.cost}; }
 applyPhysicalEffect(c){ this.physicsAdapter?.apply?.(c); }
 remove(id){const c=this.items.get(id);if(!c)return false;this.items.delete(id);this.physicsAdapter?.remove?.(c);return true;}
 list(){return [...this.items.values()];}
 update(dt){ for(const c of this.items.values()){ if(c.condition<=0){c.operational=false;continue;} if(c.foundationExposure>.2)c.condition=Math.max(0,c.condition-dt*c.foundationExposure*.0005); } }
 serialize(){return this.list().map(x=>x.serialize());}
 hydrate(v=[]){this.items.clear();for(const x of v){const c=new CoastalConstruction(x);this.items.set(c.id,c);this.applyPhysicalEffect(c);}}
}
