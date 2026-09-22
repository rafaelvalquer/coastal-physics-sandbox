export class SplashEmitter{
 constructor(particles){this.particles=particles;}
 emit(x,y,{impactEnergy=0,impactVelocity=0,impactAngle=-Math.PI/2}={}){const strength=Math.max(.15,Math.min(5,Math.sqrt(Math.max(0,impactEnergy))/80+Math.abs(impactVelocity)*.18));this.particles?.spawnPhysicalSplash?.(x,y,{strength,impactEnergy,impactVelocity,impactAngle});return strength;}
}
