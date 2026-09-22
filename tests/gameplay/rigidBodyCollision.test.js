import test from "node:test";
import assert from "node:assert/strict";
import { RigidBodySystem } from "../../src/engine/physics/RigidBodySystem.js";

test("RigidBodySystem resolve colisão corpo-corpo preservando resposta de momento",()=>{
 const s=new RigidBodySystem();
 const a=s.spawn(100,100,20,20,1000,"concrete",{vx:24,vy:0,angularVelocity:0});
 const b=s.spawn(115,100,20,20,1000,"concrete",{vx:-24,vy:0,angularVelocity:0});
 const before=a.massKg*a.vx+b.massKg*b.vx;
 s.resolveBodyCollisions();
 const after=a.massKg*a.vx+b.massKg*b.vx;
 assert.ok(a.vx<24);
 assert.ok(b.vx>-24);
 assert.ok(Math.abs(after-before)<1e-6);
 assert.ok(s.collisionPairs>=1);
});

test("debris em repouso vira obstáculo hidráulico permeável",()=>{
 const s=new RigidBodySystem();
 const body=s.spawnDebris({x:300,y:400,width:28,height:16,density:2300,material:"concrete",sourceAssemblyId:"a"});
 body.stuck=true;body.onGround=true;
 const obstacles=s.waterObstacles();
 assert.equal(obstacles.length,1);
 assert.equal(obstacles[0].id,"debris-"+body.id);
 assert.ok(obstacles[0].permeability<0.2);
});
