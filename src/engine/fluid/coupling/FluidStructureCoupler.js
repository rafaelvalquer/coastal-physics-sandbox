import { HydrostaticPressure } from "../forces/HydrostaticPressure.js";import { DynamicPressure } from "../forces/DynamicPressure.js";import { SlammingForceSolver } from "../forces/SlammingForceSolver.js";
const PX=48;
export class FluidStructureCoupler{
 constructor({water}){this.water=water;this.lastLoads=new Map();}
 sampleAt(x,{heightMeters=3,widthMeters=1,normal=1}={}){
  const i=Math.max(0,Math.min(this.water.n-1,Math.floor(x/this.water.dx))),depth=Math.max(0,this.water.h[i]/PX),u=this.water.velocityAtIndex(i)/PX,submerged=Math.min(heightMeters,depth),hydro=HydrostaticPressure.resultant(submerged,widthMeters),dynamicPressure=Math.abs(DynamicPressure.calculate(u*normal,1.5)),dynamicForce=dynamicPressure*Math.max(.01,submerged*widthMeters),breaking=this.water.breaking[i]||0,slam=SlammingForceSolver.solve({relativeVelocity:u*normal,area:Math.max(.01,submerged*widthMeters),coefficient:1.8+breaking*2,duration:.05+.08*breaking}),force=Math.max(0,hydro.force+dynamicForce+slam.force*breaking),moment=hydro.force*hydro.centerOfPressure+dynamicForce*Math.max(.1,submerged*.5)+slam.force*breaking*Math.max(.1,submerged*.7),uplift=Math.max(0,(this.water.upliftPressure?.[i]||0)*widthMeters);
  return {index:i,depth,velocity:u,hydrostaticForce:hydro.force,dynamicPressure,slammingForce:slam.force*breaking,peakPressure:hydro.maxPressure+dynamicPressure+slam.peakPressure*breaking,horizontalForce:force,moment,uplift,breaking};
 }
 evaluate(id,x,options){const load=this.sampleAt(x,options);this.lastLoads.set(id,load);return load;}
}
