export class BaselineSnapshot{
 constructor(v=null){this.value=v;}
 capture(engine,app){this.value={simTime:engine.simTime,terrain:engine.terrain.serialize(),atmosphere:engine.atmosphere.serialize(),water:engine.water.serialize(),surfaceWaves:engine.surfaceWaves.serialize(),erosion:engine.erosion.serialize(),rigidBodies:engine.rigidBodies.serialize(),particles:engine.particles.serialize(),camera:engine.camera.serialize(),scene:app.serializeScene()};return this;}
 restore(engine,app){if(!this.value)return false;engine.terrain.hydrate(this.value.terrain);engine.atmosphere.hydrate(this.value.atmosphere);engine.water.hydrate(this.value.water);engine.surfaceWaves.hydrate(this.value.surfaceWaves);engine.erosion.hydrate(this.value.erosion);engine.rigidBodies.hydrate(this.value.rigidBodies);engine.particles.hydrate(this.value.particles);engine.camera.hydrate(this.value.camera||{});engine.simTime=Number(this.value.simTime||0);app.hydrateScene(this.value.scene||{});return true;}
 serialize(){return this.value?structuredClone(this.value):null;} hydrate(v){this.value=v?structuredClone(v):null;}
}
