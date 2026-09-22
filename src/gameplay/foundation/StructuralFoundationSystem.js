import { FOUNDATION_TYPES } from "../../data/foundations.js";
import { SoilBearingSolver } from "./SoilBearingSolver.js";
import { FoundationElement } from "./FoundationElement.js";
import { Pile } from "./Pile.js";
import { RockAnchor } from "./RockAnchor.js";
import { Tieback } from "./Tieback.js";

export class StructuralFoundationSystem {
  constructor({terrain,water,grid,eventBus}){Object.assign(this,{terrain,water,grid,eventBus});this.elements=new Map();this.sequence=1;}
  create({type,x,y,assemblyId=null,id=null}){
    const cfg=FOUNDATION_TYPES[type]; if(!cfg)throw new Error("Unknown foundation type: "+type);
    const base={...cfg,id:id||"foundation-"+this.sequence++,type,x,y,assemblyId};
    let e;if(cfg.kind==="PILE")e=new Pile(base);else if(cfg.kind==="ANCHOR")e=new RockAnchor(base);else if(cfg.kind==="TIEBACK")e=new Tieback(base);else e=new FoundationElement(base);
    this.resolveCapacity(e);this.elements.set(e.id,e);this.grid.occupyFoundation(e);this.eventBus?.emit("foundation:placed",{foundation:e});return e;
  }
  resolveCapacity(e){
    const maxY=this.terrain.rows*this.terrain.cellSize-1;
    const c=this.terrain.worldToCell(e.x,Math.min(maxY,e.y+(e.depth||0)*48));const idx=this.terrain.index(c.x,c.y);
    const material=this.terrain.getMaterial(c.x,c.y)?.name||"Solo";const moisture=this.terrain.moisture[idx]||0;e.embeddedMaterial=material;
    if(e.kind==="PILE"){const r=SoilBearingSolver.pileCapacity(material,e.depth,e.diameter,moisture);e.axialCapacity=r.axial;e.lateralCapacity=r.lateral;}
    if(e.kind==="ANCHOR"||e.kind==="TIEBACK"){const base=SoilBearingSolver.materialCapacity(material,moisture)*1000;const bond=material==="Rocha"?1.8:material==="Cascalho"?.85:.35;e.rockBondStrength=bond;e.tensionCapacity=base*(e.length||5)*.08*bond;}
    if(e.kind==="SOIL_REINFORCEMENT"){e.bearingMultiplier=1.18;e.frictionMultiplier=1.12;}
  }
  attach(id,assemblyId){const e=this.elements.get(id);if(!e)return false;e.assemblyId=assemblyId;return true;}
  forAssembly(id){return [...this.elements.values()].filter(e=>e.assemblyId===id);}
  extraMassesForAssembly(a){return this.forAssembly(a.id).filter(e=>e.kind==="FOOTING"&&e.mass).map(e=>({mass:e.mass*(e.progress??1),position:{x:e.x,y:e.y}}));}
  soilAtAssembly(a){const x=a.centerOfMass.x||a.bounds?.minX||0;const gy=this.terrain.columnTopWorldYAt(x);const c=this.terrain.worldToCell(x,Math.min(this.terrain.rows*this.terrain.cellSize-1,gy+2));const idx=this.terrain.index(c.x,c.y);return {material:this.terrain.getMaterial(c.x,c.y)?.name||"Solo",moisture:this.terrain.moisture[idx]||0,integrity:this.terrain.integrity[idx]||0};}
  getResistanceForAssembly(a){
    const elements=this.forAssembly(a.id),soil=this.soilAtAssembly(a);let bearingMultiplier=1,frictionMultiplier=1,pileHorizontal=0,pileVertical=0,pileMoment=0,anchorHorizontal=0,anchorVertical=0,anchorMoment=0;
    for(const e of elements){const eff=(e.integrity??1)*(e.progress??1);
      if(e.kind==="PILE"){pileHorizontal+=(e.lateralCapacity||0)*eff;pileVertical+=(e.axialCapacity||0)*eff;pileMoment+=(e.lateralCapacity||0)*(e.depth||2.5)*.45*eff;}
      else if(e.kind==="ANCHOR"||e.kind==="TIEBACK"){const t=(e.tensionCapacity||0)*eff,ang=(e.angle||30)*Math.PI/180;anchorHorizontal+=t*Math.cos(ang);anchorVertical+=t*Math.sin(ang);anchorMoment+=t*Math.cos(ang)*Math.max(.5,a.heightMeters*.55);}
      else if(e.kind==="SOIL_REINFORCEMENT"){bearingMultiplier*=e.bearingMultiplier||1;frictionMultiplier*=e.frictionMultiplier||1;}
    }
    const bw=Math.max(.5,a.baseWidthMeters);const bearing=SoilBearingSolver.materialCapacity(soil.material,soil.moisture)*1000*bw*bearingMultiplier;const under=Math.max(0,soil.moisture-.55)*bw*12000;
    return {soil,soilFactor:Math.max(.45,(soil.integrity||.5)*frictionMultiplier),bearingCapacity:bearing,underPressure:under,pileHorizontal,pileVertical,pileMoment,anchorHorizontal,anchorVertical,anchorMoment};
  }
  solveBearing(a,f){const resistance=Math.max(1,f.bearingCapacity+f.pileVertical*.35),demand=Math.max(1,f.weight-f.buoyancy),factor=resistance/demand;return {factor,resistance,demand,state:factor>=1.5?"SAFE":factor>=1.2?"WARNING":factor>=1?"CRITICAL":"FAILING"};}
  update(dt){for(const e of this.elements.values()){if(e.integrity<=0)continue;const c=this.terrain.worldToCell(e.x,e.y),top=this.terrain.columnTopCell(c.x);if(top>=this.terrain.rows)continue;const idx=this.terrain.index(c.x,top),integrity=this.terrain.integrity[idx]||0,moisture=this.terrain.moisture[idx]||0;if(integrity<.25||moisture>.92)e.integrity=Math.max(0,e.integrity-dt*(.001+Math.max(0,moisture-.92)*.006));}}
  serialize(){return [...this.elements.values()].map(e=>e.serialize());}
  hydrate(v=[]){this.elements.clear();for(const raw of v){let e;if(raw.kind==="PILE")e=new Pile(raw);else if(raw.kind==="ANCHOR")e=new RockAnchor(raw);else if(raw.kind==="TIEBACK")e=new Tieback(raw);else e=new FoundationElement(raw);this.elements.set(e.id,e);this.grid.occupyFoundation(e);}}
}
