import { WORLD } from "../world/constants.js";
import { clamp } from "../utils/math.js";
import { SpatialHash } from "../../core/SpatialHash.js";

const PX=48;

export class RigidBodySystem{
 constructor(){
  this.bodies=[];this.nextId=1;this.fluidCoupler=null;this.spatial=new SpatialHash(64);this.collisionPairs=0;this.sleepingCount=0;
 }
 setFluidCoupler(coupler){this.fluidCoupler=coupler;}

 massFor(body){
  if(Number.isFinite(body.massKg)&&body.massKg>0)return body.massKg;
  const volume=Math.max(.0001,(body.width/PX)*(body.height/PX)*(body.thicknessMeters||.35));
  body.volumeM3=volume;body.massKg=Math.max(.1,(body.density||1000)*volume);return body.massKg;
 }

 spawn(x,y,width=18,height=10,density=650,material="wood",options={}){
  const body={id:this.nextId++,x,y,vx:options.vx||0,vy:options.vy||0,angle:options.angle||0,angularVelocity:options.angularVelocity??((Math.random()-.5)*.6),width,height,density,material,restitution:options.restitution??(material==="concrete"?.08:.16),friction:options.friction??(material==="wood"?.62:.78),drag:options.drag??.72,dragCoefficient:options.dragCoefficient??(material==="wood"?.9:1.1),thicknessMeters:options.thicknessMeters??.35,shape:options.shape||"box",sourceAssemblyId:options.sourceAssemblyId||null,stuck:false,sleepTime:0,onGround:false,collisionCount:0,_lastSubmergedFraction:0,_lastDisplacedVolume:0};
  this.massFor(body);this.bodies.push(body);return body;
 }

 spawnDebris(config={}){
  return this.spawn(config.x,config.y,config.width,config.height,config.density,config.material,{
    vx:config.vx,vy:config.vy,angle:config.angle,angularVelocity:config.angularVelocity,sourceAssemblyId:config.sourceAssemblyId,shape:config.shape,thicknessMeters:config.thicknessMeters
  });
 }

 extents(body){
  if(body.shape==="circle"){const r=Math.max(body.width,body.height)/2;return {halfW:r,halfH:r};}
  const c=Math.abs(Math.cos(body.angle||0)),s=Math.abs(Math.sin(body.angle||0));
  return {halfW:c*body.width/2+s*body.height/2,halfH:s*body.width/2+c*body.height/2};
 }

 updateSpatial(){
  this.spatial.clear();
  for(const body of this.bodies)this.spatial.insert(body);
 }

 resolveBodyCollisions(){
  this.updateSpatial();const processed=new Set();this.collisionPairs=0;
  for(const a of this.bodies){
    const ea=this.extents(a),near=this.spatial.query(a.x,a.y,Math.max(48,ea.halfW+ea.halfH+32));
    for(const b of near){
      if(a===b)continue;const key=a.id<b.id?a.id+":"+b.id:b.id+":"+a.id;if(processed.has(key))continue;processed.add(key);
      const eb=this.extents(b),dx=b.x-a.x,dy=b.y-a.y,overlapX=ea.halfW+eb.halfW-Math.abs(dx),overlapY=ea.halfH+eb.halfH-Math.abs(dy);if(overlapX<=0||overlapY<=0)continue;
      this.collisionPairs++;a.collisionCount++;b.collisionCount++;
      const useX=overlapX<overlapY,nx=useX?(dx>=0?1:-1):0,ny=useX?0:(dy>=0?1:-1),penetration=useX?overlapX:overlapY;
      const ma=this.massFor(a),mb=this.massFor(b),invA=a.stuck?0:1/ma,invB=b.stuck?0:1/mb,totalInv=invA+invB;if(totalInv<=0)continue;
      const correction=Math.max(0,penetration-.2)/totalInv*.62;
      if(!a.stuck){a.x-=nx*correction*invA;a.y-=ny*correction*invA;}
      if(!b.stuck){b.x+=nx*correction*invB;b.y+=ny*correction*invB;}
      const rvx=b.vx-a.vx,rvy=b.vy-a.vy,velNormal=rvx*nx+rvy*ny;if(velNormal>0)continue;
      const e=Math.min(a.restitution??.1,b.restitution??.1),j=-(1+e)*velNormal/totalInv,ix=j*nx,iy=j*ny;
      if(!a.stuck){a.vx-=ix*invA;a.vy-=iy*invA;}
      if(!b.stuck){b.vx+=ix*invB;b.vy+=iy*invB;}
      const tx=-ny,ty=nx,velTangent=rvx*tx+rvy*ty,mu=Math.sqrt((a.friction||.6)*(b.friction||.6)),jt=clamp(-velTangent/totalInv,-Math.abs(j)*mu,Math.abs(j)*mu),tix=jt*tx,tiy=jt*ty;
      if(!a.stuck){a.vx-=tix*invA;a.vy-=tiy*invA;a.angularVelocity-=jt/Math.max(1,ma)*.04;}
      if(!b.stuck){b.vx+=tix*invB;b.vy+=tiy*invB;b.angularVelocity+=jt/Math.max(1,mb)*.04;}
      if(Math.abs(velNormal)<10&&Math.abs(velTangent)<8){a.sleepTime+=.025;b.sleepTime+=.025;}
    }
  }
 }

 resolveTerrain(body,terrain,dt){
  const e=this.extents(body),samples=[-.5,0,.5],cos=Math.cos(body.angle||0);let maxPen=0,contactOffset=0,contacts=0;
  for(const t of samples){const offset=t*body.width*cos,x=clamp(body.x+offset,0,WORLD.width-1),ground=terrain.columnTopWorldYAt(x),bottom=body.y+e.halfH,pen=bottom-ground;if(pen>maxPen){maxPen=pen;contactOffset=t;}if(pen>-.75)contacts++;}
  body.onGround=maxPen>0;
  if(maxPen>0){
    body.y-=maxPen;
    if(body.vy>0)body.vy*=-body.restitution;
    body.vx*=Math.exp(-dt*(2.5+(body.friction||.6)*3.5));
    body.angularVelocity+=-contactOffset*body.vy*.003;
    body.angularVelocity*=Math.exp(-dt*4.2);
    const speed=Math.hypot(body.vx,body.vy);
    if(speed<7&&Math.abs(body.angularVelocity)<.22&&contacts>=2)body.sleepTime+=dt;else body.sleepTime=Math.max(0,body.sleepTime-dt*.5);
    if(body.sleepTime>1.1){body.stuck=true;body.vx=0;body.vy=0;body.angularVelocity=0;}
  }else body.sleepTime=Math.max(0,body.sleepTime-dt);
 }

 update(dt,water,terrain){
  this.sleepingCount=0;
  for(const body of this.bodies){
    if(body.stuck){
      const flow=Math.abs(water.velocityAtX(body.x)),depth=water.depthAtX(body.x),mass=this.massFor(body);
      if(flow>58&&depth>8){body.stuck=false;body.sleepTime=.25;body.vx=water.velocityAtX(body.x)*.22;}
      else{this.sleepingCount++;continue;}
    }

    let ax=0,ay=WORLD.gravity;
    if(this.fluidCoupler){const f=this.fluidCoupler.solve(body,dt);ax+=f.axPx;ay=f.ayPx;body.fluidForces=f;}
    else{
      const surfaceY=water.surfaceYAtX(body.x),bottom=body.y+body.height/2,submerged=clamp(bottom-surfaceY,0,body.height)/body.height;
      if(submerged>0){ay-=WORLD.gravity*(1000/body.density)*submerged;const flowU=water.velocityAtX(body.x);ax+=(flowU-body.vx)*body.drag*submerged*1.8;body.vy+=(-body.vy*1.7*submerged)*dt;}
    }

    body.vx+=ax*dt;body.vy+=ay*dt;body.x+=body.vx*dt;body.y+=body.vy*dt;body.angle+=body.angularVelocity*dt;
    const submerged=body.fluidForces?.submerged||0;body.angularVelocity*=Math.exp(-dt*submerged*1.5);body.x=clamp(body.x,this.extents(body).halfW,WORLD.width-this.extents(body).halfW);
    this.resolveTerrain(body,terrain,dt);
  }

  this.resolveBodyCollisions();
  for(const body of this.bodies)if(!body.stuck)this.resolveTerrain(body,terrain,dt);
  this.bodies=this.bodies.filter(body=>body.y<WORLD.height+100);
 }

 waterObstacles(){
  return this.bodies.filter(b=>b.stuck&&b.onGround).map(body=>{const e=this.extents(body);return {id:"debris-"+body.id,minX:Math.max(0,body.x-e.halfW),maxX:Math.min(WORLD.width,body.x+e.halfW),topY:body.y-e.halfH,progress:1,permeability:body.material==="wood"?.35:body.material==="tile"?.22:.08};});
 }

 serialize(){return {bodies:this.bodies,nextId:this.nextId};}
 hydrate(data){this.bodies=Array.isArray(data?.bodies)?data.bodies:[];this.nextId=Number(data?.nextId||1);for(const b of this.bodies)this.massFor(b);}
}
