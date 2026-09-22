export class WakeGenerator{
 constructor({surfaceWaves,water}){this.surfaceWaves=surfaceWaves;this.water=water;}
 generate(body,relativeVelocityPx,submergedFraction){
  if(submergedFraction<=.05||Math.abs(relativeVelocityPx)<5)return;
  const magnitude=Math.max(-2.5,Math.min(2.5,relativeVelocityPx/90*submergedFraction));
  this.surfaceWaves?.addImpulse?.(body.x,-magnitude,5);
 }
}
