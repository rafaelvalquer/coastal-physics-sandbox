import { WORLD } from "../world/constants.js";
import { clamp } from "../utils/math.js";

export class RigidBodySystem{
 constructor(){this.bodies=[];this.nextId=1;this.fluidCoupler=null;}
 setFluidCoupler(coupler){this.fluidCoupler=coupler;}
 spawn(x,y,width=18,height=10,density=650,material="wood"){
  const body={id:this.nextId++,x,y,vx:0,vy:0,angle:0,angularVelocity:(Math.random()-.5)*.6,width,height,density,material,restitution:.18,drag:.72,dragCoefficient:material==="wood"?.9:1.1,thicknessMeters:1,_lastSubmergedFraction:0,_lastDisplacedVolume:0};
  this.bodies.push(body);return body;
 }
 update(dt,water,terrain){
  for(const body of this.bodies){
   let ax=0,ay=WORLD.gravity;
   if(this.fluidCoupler){const f=this.fluidCoupler.solve(body,dt);ax+=f.axPx;ay=f.ayPx;body.fluidForces=f;}
   else{
    const surfaceY=water.surfaceYAtX(body.x),bottom=body.y+body.height/2,submerged=clamp(bottom-surfaceY,0,body.height)/body.height;if(submerged>0){ay-=WORLD.gravity*(1000/body.density)*submerged;const flowU=water.velocityAtX(body.x);ax+=(flowU-body.vx)*body.drag*submerged*1.8;body.vy+=(-body.vy*1.7*submerged)*dt;}
   }
   body.vx+=ax*dt;body.vy+=ay*dt;body.x+=body.vx*dt;body.y+=body.vy*dt;body.angle+=body.angularVelocity*dt;
   const submerged=body.fluidForces?.submerged||0;body.angularVelocity*=Math.exp(-dt*submerged*1.5);body.x=clamp(body.x,body.width/2,WORLD.width-body.width/2);
   const groundY=terrain.columnTopWorldYAt(body.x);if(body.y+body.height/2>groundY){body.y=groundY-body.height/2;if(body.vy>0)body.vy*=-body.restitution;body.vx*=.82;body.angularVelocity*=.72;}
  }
  this.bodies=this.bodies.filter(body=>body.y<WORLD.height+100);
 }
 serialize(){return {bodies:this.bodies,nextId:this.nextId};}
 hydrate(data){this.bodies=Array.isArray(data?.bodies)?data.bodies:[];this.nextId=Number(data?.nextId||1);}
}
