import { BuoyancySolver } from "./BuoyancySolver.js";import { AddedMassSolver } from "./AddedMassSolver.js";import { DisplacementSolver } from "./DisplacementSolver.js";
const RHO=1000,PX=48,G=9.81;
export class FluidRigidBodyCoupler{
 constructor({water,impactCoupler,wakeGenerator}){Object.assign(this,{water,impactCoupler,wakeGenerator});}
 ensureMass(body){if(!body.massKg){const volume=Math.max(.0001,(body.width/PX)*(body.height/PX)*(body.thicknessMeters||1));body.volumeM3=volume;body.massKg=Math.max(1,body.density*volume);}return body.massKg;}
 solve(body,dt){
  const mass=this.ensureMass(body),surfaceY=this.water.surfaceYAtX(body.x),buoyancy=BuoyancySolver.solve(body,surfaceY),flowPx=this.water.velocityAtX(body.x),relPx=flowPx-body.vx,relM=relPx/PX;
  const areaM=Math.max(.01,(body.height/PX)*(body.thicknessMeters||1)*buoyancy.fraction),cd=body.dragCoefficient||1.05,dragN=.5*RHO*cd*areaM*relM*Math.abs(relM),prevRel=body._lastRelativeWaterVelocityM??relM,relAccel=(relM-prevRel)/Math.max(1e-4,dt),addedN=AddedMassSolver.force({submergedVolume:buoyancy.volume,relativeAcceleration:relAccel,coefficient:.65});
  body._lastRelativeWaterVelocityM=relM;
  const axPx=(dragN+addedN)/mass*PX,ayPx=G*PX-buoyancy.force/mass*PX;
  const displacedDelta=buoyancy.volume-(body._lastDisplacedVolume||0);DisplacementSolver.applyDelta(this.water,body.x,displacedDelta,4);body._lastDisplacedVolume=buoyancy.volume;
  if(buoyancy.fraction>.02){const horizontalImpulse=-(dragN+addedN)*dt;this.impactCoupler?.applyImpulse?.(body.x,horizontalImpulse,{radius:4,splash:false});this.wakeGenerator?.generate?.(body,relPx,buoyancy.fraction);}
  const entering=body._lastSubmergedFraction<=.03&&buoyancy.fraction>.08;if(entering){const verticalM=Math.abs(body.vy/PX),impulse=mass*verticalM*.35;this.impactCoupler?.applyImpulse?.(body.x,Math.sign(body.vx||1)*impulse*.18,{radius:6,splash:true,verticalEnergy:.5*mass*verticalM*verticalM});}
  body._lastSubmergedFraction=buoyancy.fraction;
  return {axPx,ayPx,submerged:buoyancy.fraction,buoyancyForce:buoyancy.force,dragForce:dragN,addedMassForce:addedN};
 }
}
