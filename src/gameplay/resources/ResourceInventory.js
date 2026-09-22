import { MaterialStockpile, MATERIAL_PRICES } from "./MaterialStockpile.js";
export class ResourceInventory {
  constructor({budget,initialMaterials}={}){this.budget=budget;this.materials=new MaterialStockpile(initialMaterials);this.equipment=new Set(["EXCAVATOR","CRANE","PILE_DRIVER","DUMP_TRUCK","PORTABLE_PUMP"]);}
  canPlan({cost=0,materials={},requiredEquipment=[]}={}){if(this.budget&&!this.budget.canAfford(cost))return {ok:false,reason:"Orçamento insuficiente"};if(!this.materials.canReserve(materials))return {ok:false,reason:"Materiais insuficientes"};const missing=requiredEquipment.filter(x=>!this.equipment.has(x));return missing.length?{ok:false,reason:"Equipamento necessário: "+missing.join(", ")}:{ok:true};}
  reserve(jobId,req){const check=this.canPlan(req);if(!check.ok)return check;if(this.budget&&req.cost>0&&!this.budget.spend(req.cost,"STRUCTURAL_JOB",jobId))return {ok:false,reason:"Orçamento insuficiente"};if(!this.materials.reserve(jobId,req.materials||{}))return {ok:false,reason:"Materiais insuficientes"};return {ok:true};}
  complete(id){this.materials.consume(id);} cancel(id){this.materials.release(id);}
  purchase(material,quantity=1){const qty=Math.max(.1,Number(quantity)||0);const unit=MATERIAL_PRICES[material];if(!unit)return {ok:false,reason:"Material desconhecido"};const cost=unit*qty;if(this.budget&&!this.budget.spend(cost,"MATERIAL_PURCHASE",material))return {ok:false,reason:"Orçamento insuficiente"};this.materials.credit(material,qty);return {ok:true,cost,material,quantity:qty};}
  snapshot(){return {materials:this.materials.snapshot(),equipment:[...this.equipment]};}
  serialize(){return {materials:this.materials.serialize(),equipment:[...this.equipment]};}
  hydrate(v={}){this.materials.hydrate(v.materials||{});this.equipment=new Set(v.equipment||[...this.equipment]);}
}
