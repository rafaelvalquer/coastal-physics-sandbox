import { WORLD } from "../world/constants.js";
import { clamp } from "../utils/math.js";

export class ParticleSystem{
 constructor(){this.items=[];this.surfaceWaves=null;}
 setSurfaceWaves(surfaceWaves){this.surfaceWaves=surfaceWaves;}
 spawnFoam(x,y,vx,vy,intensity=.5){
  if(this.items.length>=WORLD.maxParticles)return;const count=1+Math.floor(intensity*3);
  for(let i=0;i<count&&this.items.length<WORLD.maxParticles;i++)this.items.push({type:"foam",x:x+(Math.random()-.5)*8,y:y+(Math.random()-.5)*4,vx:vx+(Math.random()-.5)*30,vy:vy-Math.random()*20,life:.5+Math.random()*1.4,maxLife:1.9,radius:1.5+Math.random()*2.8});
 }
 spawnSediment(x,y,currentV=0){
  if(this.items.length>=WORLD.maxParticles)return;for(let i=0;i<5&&this.items.length<WORLD.maxParticles;i++)this.items.push({type:"sediment",x:x+(Math.random()-.5)*8,y:y+(Math.random()-.5)*7,vx:currentV*.22+(Math.random()-.5)*18,vy:-5-Math.random()*14,life:.7+Math.random()*1.6,maxLife:2.3,radius:1+Math.random()*2.2});
 }
 spawnSplash(x,y,strength=1){return this.spawnPhysicalSplash(x,y,{strength});}
 spawnPhysicalSplash(x,y,{strength=1,impulseNs=0,verticalEnergy=0,impactVelocity=0,impactAngle=-Math.PI/2}={}){
  if(this.items.length>=WORLD.maxParticles)return;const energyStrength=Math.sqrt(Math.max(0,verticalEnergy))/95,impulseStrength=Math.sqrt(Math.max(0,impulseNs))/45,s=Math.max(.35,Math.min(5,Math.max(Math.abs(strength),energyStrength,impulseStrength,Math.abs(impactVelocity)*.15))),count=Math.min(32,4+Math.floor(s*5));
  for(let i=0;i<count&&this.items.length<WORLD.maxParticles;i++){const angle=impactAngle+(Math.random()-.5)*Math.PI*.9,speed=35+Math.random()*(55+45*s);this.items.push({type:"water",x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.55+Math.random()*.9,maxLife:1.45,radius:1+Math.random()*2.4,mass:.0005+Math.random()*.002});}
 }
 spawnDirectedSpray(x,y,{count=8,speed=90,direction=-Math.PI/2,spread=.55}={}){
  for(let i=0;i<count&&this.items.length<WORLD.maxParticles;i++){const angle=direction+(Math.random()-.5)*spread*2,s=speed*(.55+Math.random()*.7);this.items.push({type:"water",x,y,vx:Math.cos(angle)*s,vy:Math.sin(angle)*s,life:.4+Math.random()*.7,maxLife:1.1,radius:.8+Math.random()*1.8,mass:.0004});}
 }
 update(dt,water,terrain){
  const next=[];for(const p of this.items){p.life-=dt;if(p.life<=0)continue;p.vx+=(p.type==="foam"?.22:.1)*(water?.atmosphereWindPx||0)*dt;p.vy+=(p.type==="foam"?115:250)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<-20||p.x>WORLD.width+20||p.y>WORLD.height+20)continue;
   const waterY=water.surfaceYAtX(clamp(p.x,0,WORLD.width-1));if((p.type==="water"||p.type==="foam")&&p.y>waterY){if(p.type==="water"&&p.vy>20)this.surfaceWaves?.addImpulse?.(p.x,Math.min(1.4,p.vy/150),3);p.y=waterY-1;p.vy*=-.08;p.vx=p.vx*.65+water.velocityAtX(p.x)*.25;p.life*=.86;}
   const terrainY=terrain.columnTopWorldYAt(clamp(p.x,0,WORLD.width-1));if(p.y>terrainY)p.life=0;if(p.life>0)next.push(p);
  }this.items=next;
 }
 serialize(){return this.items.slice(0,500);}
 hydrate(items){this.items=Array.isArray(items)?items.slice(0,WORLD.maxParticles):[];}
}
