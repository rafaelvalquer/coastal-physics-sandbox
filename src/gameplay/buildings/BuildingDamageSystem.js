const RHO=1000;
export class BuildingDamageSystem {
  constructor({terrain,water,atmosphere,buildingManager,eventBus,damageMultiplier=1}){ Object.assign(this,{terrain,water,atmosphere,buildingManager,eventBus}); this.damageMultiplier=damageMultiplier; this.elapsed=0; }
  sampleWater(b){ if(!this.water)return {depth:0,velocity:0}; const i=Math.max(0,Math.min(this.water.n-1,Math.floor(b.x/this.water.dx))); return {depth:Math.max(0,(this.water.h[i]||0)/48),velocity:Math.abs((this.water.velocityAtIndex?.(i)||0)/48)}; }
  update(dt){ this.elapsed+=dt; for(const b of this.buildingManager.list()){ if(b.integrity<=0)continue; const {depth,velocity}=this.sampleWater(b); let damage=0; if(depth>.1){ const exposure=Math.max(0,depth-.1); damage+=exposure*(1-b.floodResistance)*dt*.7; }
    if(velocity>.25&&depth>.15){ const area=b.width*Math.min(b.height,depth*10); const pressure=.5*RHO*velocity*velocity; damage+=(pressure*area/1e6)*(1-b.impactResistance)*dt*.35; }
    const wind=Math.abs(this.atmosphere?.wind||0); if(wind>18)damage+=(wind-18)*.002*(1-b.windResistance)*dt;
    if(b.foundation.supportRatio<.6)damage+=(.6-b.foundation.supportRatio)*8*dt;
    if(b.foundation.supportRatio<.4)damage+=25*dt;
    if(damage>0)this.buildingManager.damage(b.id,damage*this.damageMultiplier,"ENVIRONMENT");
  }}
}
