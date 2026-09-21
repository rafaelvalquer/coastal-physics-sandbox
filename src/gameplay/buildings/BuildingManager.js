import { Building } from "./Building.js";
import { SpatialHash } from "../../core/SpatialHash.js";
export class BuildingManager {
  constructor(eventBus){ this.eventBus=eventBus; this.items=new Map(); this.spatial=new SpatialHash(80); }
  add(config){ const b=config instanceof Building?config:new Building(config); this.items.set(b.id,b); this.reindex(); this.eventBus?.emit("building:placed",{building:b}); return b; }
  remove(id){ const b=this.items.get(id); if(!b)return false; this.items.delete(id); this.reindex(); return true; }
  get(id){ return this.items.get(id); } list(){ return [...this.items.values()]; }
  reindex(){ this.spatial.clear(); for(const b of this.items.values())this.spatial.insert(b); }
  near(x,y,r=80){ return this.spatial.query(x,y,r); }
  damage(id,amount,cause){ const b=this.get(id); if(!b)return 0; const before=b.integrity; b.damage(amount,cause); const damage=before-b.integrity; if(damage>0)this.eventBus?.emit("building:damaged",{buildingId:id,damage,cause,position:{x:b.x,y:b.y}}); if(before>0&&b.integrity<=0)this.eventBus?.emit("building:destroyed",{buildingId:id,cause}); return damage; }
  serialize(){ return this.list().map(b=>b.serialize()); }
  hydrate(data=[]){ this.items.clear(); for(const v of data)this.add(new Building(v)); }
}
