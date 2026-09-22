export const MATERIAL_UNITS={CONCRETE:"t",ROCK:"t",STEEL:"t",GRAVEL:"t",SAND:"t",GEOTEXTILE:"m²"};
export class MaterialStockpile {
  constructor(initial={}){this.stock={CONCRETE:18,ROCK:32,STEEL:4,GRAVEL:18,SAND:24,GEOTEXTILE:120,...initial};this.reserved=new Map();}
  available(material){const reserved=[...this.reserved.values()].reduce((s,r)=>s+Number(r[material]||0),0);return Math.max(0,Number(this.stock[material]||0)-reserved);}
  canReserve(req={}){return Object.entries(req).every(([m,q])=>this.available(m)+1e-9>=Number(q||0));}
  reserve(id,req={}){if(!this.canReserve(req))return false;this.reserved.set(id,{...req});return true;}
  consume(id){const r=this.reserved.get(id);if(!r)return false;for(const [m,q] of Object.entries(r))this.stock[m]=Math.max(0,Number(this.stock[m]||0)-Number(q||0));this.reserved.delete(id);return true;}
  release(id){return this.reserved.delete(id);}
  credit(m,q){this.stock[m]=Number(this.stock[m]||0)+Number(q||0);}
  snapshot(){return {stock:{...this.stock},available:Object.fromEntries(Object.keys(this.stock).map(k=>[k,this.available(k)]))};}
  serialize(){return {stock:{...this.stock},reserved:[...this.reserved.entries()]};}
  hydrate(v={}){this.stock={...this.stock,...(v.stock||{})};this.reserved=new Map(v.reserved||[]);}
}
