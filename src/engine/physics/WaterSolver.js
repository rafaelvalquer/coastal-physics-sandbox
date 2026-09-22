import { WORLD } from "../world/constants.js";
import { clamp } from "../utils/math.js";
import { HydrostaticReconstruction } from "../fluid/core/HydrostaticReconstruction.js";
import { RiemannSolver } from "../fluid/core/RiemannSolver.js";
import { WetDrySolver } from "../fluid/core/WetDrySolver.js";
import { CFLController } from "../fluid/core/CFLController.js";
import { BottomFriction } from "../fluid/forces/BottomFriction.js";
import { WindStress } from "../fluid/forces/WindStress.js";
import { InfiltrationSystem } from "../fluid/hydrology/InfiltrationSystem.js";
import { RainfallRunoffSystem } from "../fluid/hydrology/RainfallRunoffSystem.js";
import { WaveShoalingSystem } from "../fluid/waves/WaveShoalingSystem.js";
import { BreakingWaveSystem } from "../fluid/waves/BreakingWaveSystem.js";
import { SwashZoneSystem } from "../fluid/waves/SwashZoneSystem.js";
import { FoamField } from "../fluid/effects/FoamField.js";
import { MassBalance } from "../fluid/diagnostics/MassBalance.js";
import { MomentumBalance } from "../fluid/diagnostics/MomentumBalance.js";
import { EnergyBalance } from "../fluid/diagnostics/EnergyBalance.js";
import { WaterDiagnostics } from "../fluid/diagnostics/WaterDiagnostics.js";

const EPS=0.05,PX=48,RHO=1000,G_METERS=9.81;

export class WaterSolver{
 constructor(terrain,atmosphere,particles){
  Object.assign(this,{terrain,atmosphere,particles});this.dx=WORLD.waterDx;this.n=Math.ceil(WORLD.width/this.dx);this.g=WORLD.gravity;
  this.h=new Float32Array(this.n);this.q=new Float32Array(this.n);this.hu=this.q;this.bed=new Float32Array(this.n);this.eta=new Float32Array(this.n);this.pressure=new Float32Array(this.n);this.dynamicPressure=new Float32Array(this.n);this.upliftPressure=new Float32Array(this.n);this.bedShear=new Float32Array(this.n);this.breaking=new Float32Array(this.n);this.sediment=new Float32Array(this.n);
  this.massFlux=new Float32Array(this.n+1);this.momentumFluxLeft=new Float32Array(this.n+1);this.momentumFluxRight=new Float32Array(this.n+1);this.nextH=new Float32Array(this.n);this.nextQ=new Float32Array(this.n);this.sedimentFlux=new Float32Array(this.n+1);this.nextSediment=new Float32Array(this.n);
  this.wetDry=new WetDrySolver(this.n,{dryDepth:EPS,wetDepth:.14});this.cflController=new CFLController({cfl:.76,maxSubsteps:12});this.infiltration=new InfiltrationSystem(terrain);this.rainfall=new RainfallRunoffSystem({terrain,infiltration:this.infiltration});this.shoaling=new WaveShoalingSystem(this.n);this.breaker=new BreakingWaveSystem(this.n);this.swash=new SwashZoneSystem(this.n);this.foamField=new FoamField(this.n);this.foam=this.foamField.concentration;
  this.massBalance=new MassBalance();this.momentumBalance=new MomentumBalance();this.energyBalance=new EnergyBalance();this.diagnostics=new WaterDiagnostics({mass:this.massBalance,momentum:this.momentumBalance,energy:this.energyBalance,cfl:this.cflController});
  this.baseSeaElevation=WORLD.height-WORLD.seaLevelY;this.time=0;this.totalVolume=0;this.kineticEnergy=0;this.waveEnergy=0;this.offshoreBoundary=null;this.structuralObstacles=[];this.debrisObstacles=[];this.significantWaveHeightMeters=1;this.refreshBed();this.resetWater();
 }
 refreshBed(){
  for(let i=0;i<this.n;i++){const x=(i+.5)*this.dx,bedY=this.terrain.columnTopWorldYAt(x);this.bed[i]=WORLD.height-bedY;}
  for(const o of [...(this.structuralObstacles||[]),...(this.debrisObstacles||[])]){const progress=clamp(o.progress??1,0,1);if(progress<=.02)continue;const permeability=clamp(o.permeability??0,0,1),effective=progress*(1-permeability*.55),crest=Math.max(0,(WORLD.height-o.topY)*effective),first=Math.max(0,Math.floor(o.minX/this.dx)),last=Math.min(this.n-1,Math.ceil(o.maxX/this.dx));for(let i=first;i<=last;i++)this.bed[i]=Math.max(this.bed[i],crest);}
 }
 resetWater(){const sea=this.baseSeaElevation;for(let i=0;i<this.n;i++){this.h[i]=Math.max(0,sea-this.bed[i]);this.q[i]=0;this.sediment[i]=0;this.breaking[i]=0;this.foam[i]=0;this.wetDry.state[i]=this.h[i]>EPS?2:0;}this.updateDerived();this.massBalance.reset(this.totalVolume);this.momentumBalance.reset();this.energyBalance.reset();}
 velocityAtIndex(i){const h=this.h[i];return h>EPS?this.q[i]/h:0;}
 surfaceYAtIndex(i){const j=clamp(i,0,this.n-1);return this.h[j]<=EPS?WORLD.height-this.bed[j]:WORLD.height-(this.bed[j]+this.h[j]);}
 surfaceYAtX(x){const fx=clamp(x/this.dx-.5,0,this.n-1),i=Math.floor(fx),j=Math.min(this.n-1,i+1),t=fx-i;return this.surfaceYAtIndex(i)*(1-t)+this.surfaceYAtIndex(j)*t;}
 depthAtX(x){return this.h[clamp(Math.floor(x/this.dx),0,this.n-1)];}
 velocityAtX(x){return this.velocityAtIndex(clamp(Math.floor(x/this.dx),0,this.n-1));}
 addImpulse(x,strength=1){const c=clamp(Math.floor(x/this.dx),0,this.n-1),radius=8;for(let d=-radius;d<=radius;d++){const i=c+d;if(i<0||i>=this.n||this.h[i]<=EPS)continue;const w=Math.exp(-(d*d)/18),direction=d===0?0:Math.sign(d);this.q[i]+=strength*900*w*direction;}this.momentumBalance.body+=strength*900;}
 addWaterAtIndex(i,amount){if(i<0||i>=this.n||amount<=0)return;this.h[i]+=amount;this.massBalance.source(amount*this.dx);}
 setOffshoreBoundary(v=null){this.offshoreBoundary=v?{...v}:null;if(Number.isFinite(v?.significantWaveHeightMeters))this.significantWaveHeightMeters=v.significantWaveHeightMeters;}
 setStructuralObstacles(v=[]){this.structuralObstacles=v.map(x=>({...x}));}
 setDebrisObstacles(v=[]){this.debrisObstacles=v.map(x=>({...x}));}

 update(dt){
  this.time+=dt;this.refreshBed();const steps=this.cflController.substeps(dt,this.dx,this.h,this.q,this.g),subdt=dt/steps;
  for(let s=0;s<steps;s++)this.integrate(subdt);
  this.shoaling.update(this,this.significantWaveHeightMeters);this.breaker.update(dt,this,this.shoaling.factor,this.significantWaveHeightMeters);this.breaking.set(this.breaker.intensity);this.foamField.update(dt,this);this.swash.update(this);this.updateDerived();this.diagnostics.scan(this.h,this.q);
 }

 integrate(dt){
  this.applyBoundary(dt);
  if(this.atmosphere.rain>0){const rain=this.rainfall.apply({rainfallMmPerHour:this.atmosphere.rain,dt,h:this.h,dx:this.dx,hydrologyTimeScale:this.atmosphere.hydrologyTimeScale||1});this.massBalance.source(rain.runoff*this.dx);}
  this.computeFluxes();
  const invDx=1/this.dx;
  for(let i=0;i<this.n;i++){
   let h=this.h[i]-dt*invDx*(this.massFlux[i+1]-this.massFlux[i]);
   let q=this.q[i]-dt*invDx*(this.momentumFluxLeft[i+1]-this.momentumFluxRight[i]);
   if(h>EPS){
    let u=q/h;const surface=this.terrain.surfaceCellForWorldX((i+.5)*this.dx),idx=surface.y<this.terrain.rows?this.terrain.index(surface.x,surface.y):-1,mat=surface.y<this.terrain.rows?this.terrain.getMaterial(surface.x,surface.y):{key:"AIR"},vegetation=idx>=0?(this.terrain.vegetation?.[idx]||0):0;
    const frictionA=BottomFriction.acceleration({velocityPx:u,depthPx:h,materialKey:mat.key,vegetation});u+=frictionA*dt;this.bedShear[i]=BottomFriction.shear({velocityPx:u,depthPx:h,materialKey:mat.key,vegetation});this.momentumBalance.friction+=frictionA*h*dt;
    const wind=this.atmosphere.windAt(i/Math.max(1,this.n-1)),windA=WindStress.acceleration(wind,u,h);u+=windA*dt;this.momentumBalance.wind+=windA*h*dt;
    const maxU=Math.max(0,.94*this.dx/dt-Math.sqrt(this.g*h));u=clamp(u,-maxU,maxU);q=u*h;
   }
   const wet=this.wetDry.enforce(Math.max(0,h),q,i);this.nextH[i]=wet.h;this.nextQ[i]=wet.hu;
  }
  const boundaryDelta=dt*(this.massFlux[0]-this.massFlux[this.n]);if(boundaryDelta>=0)this.massBalance.source(boundaryDelta);else this.massBalance.sink(-boundaryDelta);
  this.h.set(this.nextH);this.q.set(this.nextQ);this.transportSediment(dt);
 }

 applyBoundary(dt){
  const tidePx=(this.atmosphere.tide||0)*PX,base=this.baseSeaElevation+tidePx,external=this.offshoreBoundary,elevation=external?.elevationPx??((external?.waveAmplitudePx||0)*(external?.signal||0)+(external?.levelOffsetPx||0)),targetEta=base+elevation,targetVelocity=external?.velocityPx??external?.currentVelocityPx??0;
  let deltaVolume=0;
  for(let i=0;i<Math.min(12,this.n);i++){const targetH=Math.max(0,targetEta-this.bed[i]),rate=Math.max(.8,5.2-i*.34),nudge=1-Math.exp(-dt*rate),before=this.h[i];this.h[i]+=(targetH-this.h[i])*nudge;this.q[i]+=(targetVelocity*this.h[i]-this.q[i])*nudge*.24;deltaVolume+=(this.h[i]-before)*this.dx;}
  if(deltaVolume>=0)this.massBalance.source(deltaVolume);else this.massBalance.sink(-deltaVolume);
 }

 computeFluxes(){
  const leftBoundary={h:this.h[0],hu:this.q[0],u:this.velocityAtIndex(0)},lf=RiemannSolver.physicalFlux(leftBoundary,this.g);this.massFlux[0]=lf.mass;this.momentumFluxLeft[0]=lf.momentum;this.momentumFluxRight[0]=lf.momentum;
  for(let k=1;k<this.n;k++){const i=k-1,j=k,r=HydrostaticReconstruction.interface({h:this.h[i],hu:this.q[i],bed:this.bed[i]},{h:this.h[j],hu:this.q[j],bed:this.bed[j]}),f=RiemannSolver.hll(r.left,r.right,this.g);this.massFlux[k]=f.mass;this.momentumFluxLeft[k]=f.momentum+HydrostaticReconstruction.momentumCorrection(this.g,r.left.originalH,r.left.h);this.momentumFluxRight[k]=f.momentum+HydrostaticReconstruction.momentumCorrection(this.g,r.right.originalH,r.right.h);}
  const n=this.n-1,rightBoundary={h:this.h[n],hu:this.q[n],u:this.velocityAtIndex(n)},rf=RiemannSolver.physicalFlux(rightBoundary,this.g);this.massFlux[this.n]=rf.mass;this.momentumFluxLeft[this.n]=rf.momentum;this.momentumFluxRight[this.n]=rf.momentum;
 }

 transportSediment(dt){this.sedimentFlux[0]=0;for(let k=1;k<this.n;k++){const u=.5*(this.velocityAtIndex(k-1)+this.velocityAtIndex(k)),donor=u>=0?k-1:k;this.sedimentFlux[k]=u*this.sediment[donor];}this.sedimentFlux[this.n]=0;const invDx=1/this.dx;for(let i=0;i<this.n;i++){const adv=this.sediment[i]-dt*invDx*(this.sedimentFlux[i+1]-this.sedimentFlux[i]),left=this.sediment[Math.max(0,i-1)],right=this.sediment[Math.min(this.n-1,i+1)];this.nextSediment[i]=Math.max(0,adv+(left+right-2*this.sediment[i])*dt*.45);}this.sediment.set(this.nextSediment);}

 updateDerived(){
  let volume=0,kinetic=0,waveEnergy=0,potential=0,momentum=0;const meanSea=this.baseSeaElevation+(this.atmosphere.tide||0)*PX;
  for(let i=0;i<this.n;i++){const h=this.h[i],u=h>EPS?this.q[i]/h:0,hM=h/PX,uM=u/PX;this.eta[i]=this.bed[i]+h;this.pressure[i]=RHO*G_METERS*hM;this.dynamicPressure[i]=.5*RHO*uM*Math.abs(uM);this.upliftPressure[i]=this.pressure[i]*Math.min(1,.22+(this.breaking[i]||0)*.45);volume+=h*this.dx;kinetic+=.5*h*u*u*this.dx;momentum+=this.q[i]*this.dx;const dEta=this.eta[i]-meanSea;waveEnergy+=.5*this.g*dEta*dEta*this.dx;potential+=.5*this.g*h*h*this.dx;}
  this.totalVolume=volume;this.kineticEnergy=kinetic;this.waveEnergy=waveEnergy;this.momentumBalance.current=momentum;this.energyBalance.kinetic=kinetic;this.energyBalance.potential=potential;this.energyBalance.wave=waveEnergy;this.energyBalance.breaking=this.breaker.dissipatedEnergy;this.massBalance.update(volume);
 }

 diagnosticSnapshot(){return this.diagnostics.snapshot();}
 serialize(){return {h:Array.from(this.h),q:Array.from(this.q),sediment:Array.from(this.sediment),foam:Array.from(this.foam),wetDry:Array.from(this.wetDry.state),time:this.time,significantWaveHeightMeters:this.significantWaveHeightMeters};}
 hydrate(data){if(!data)return;this.refreshBed();if(data.h?.length===this.n)this.h.set(data.h);if(data.q?.length===this.n)this.q.set(data.q);if(data.sediment?.length===this.n)this.sediment.set(data.sediment);if(data.foam?.length===this.n)this.foam.set(data.foam);if(data.wetDry?.length===this.n)this.wetDry.state.set(data.wetDry);this.time=Number(data.time||0);this.significantWaveHeightMeters=Number(data.significantWaveHeightMeters||1);this.updateDerived();this.massBalance.reset(this.totalVolume);}
}
