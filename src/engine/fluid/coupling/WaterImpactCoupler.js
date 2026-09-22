const RHO_WATER=1000,PX=48;
export class WaterImpactCoupler{
 constructor({water,surfaceWaves=null,particles=null,diagnostics=null}={}){Object.assign(this,{water,surfaceWaves,particles,diagnostics});this.lastImpact=null;}
 applyImpulse(x,impulseNs,{radius=5,splash=true,verticalEnergy=0}={}){
  if(!Number.isFinite(impulseNs)||Math.abs(impulseNs)<1e-6)return 0;
  const c=Math.max(0,Math.min(this.water.n-1,Math.floor(x/this.water.dx))),kernel=[];let ws=0;
  for(let d=-radius;d<=radius;d++){const i=c+d;if(i<0||i>=this.water.n||this.water.h[i]<=.02)continue;const w=Math.exp(-(d*d)/(radius*1.35));kernel.push([i,w]);ws+=w;}
  if(!kernel.length)return 0;
  let accepted=0;
  for(const [i,w] of kernel){const share=impulseNs*w/ws,hM=Math.max(.01,this.water.h[i]/PX),dxM=this.water.dx/PX,mass=RHO_WATER*hM*dxM,duM=share/Math.max(1,mass),duPx=duM*PX;this.water.q[i]+=this.water.h[i]*duPx;accepted+=share;}
  this.surfaceWaves?.addImpulse?.(x,Math.sign(impulseNs)*Math.min(3,Math.abs(impulseNs)/3500),Math.max(4,radius));
  if(splash&&this.particles?.spawnPhysicalSplash)this.particles.spawnPhysicalSplash(x,this.water.surfaceYAtX(x),{impulseNs:Math.abs(impulseNs),verticalEnergy});
  this.diagnostics?.momentum&&(this.diagnostics.momentum.body+=accepted);
  this.diagnostics?.energy&&(this.diagnostics.energy.impacts+=Math.abs(accepted));
  this.lastImpact={x,impulseNs:accepted,verticalEnergy,time:this.water.time};
  return accepted;
 }
}
