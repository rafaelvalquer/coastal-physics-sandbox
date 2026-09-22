import { MetricSeries } from "./MetricSeries.js";import { ImpactAnalyzer } from "./ImpactAnalyzer.js";
const PX=48;
export class MetricsRecorder{
 constructor({sampleHz=5}={}){this.sampleInterval=1/sampleHz;this.accumulator=0;this.series={};for(const n of ["waveHeight","maxWaterDepth","floodedArea","floodVolume","maxVelocity","erodedVolume","depositedVolume","buildingsFlooded","buildingsDamaged","buildingsDestroyed","populationExposed","roadLengthFlooded","powerFailures","defensesFailed"])this.series[n]=new MetricSeries(n);this.resetHeatmaps(0);}
 resetHeatmaps(n){this.maxDepthByCell=new Float32Array(n);this.maxVelocityByCell=new Float32Array(n);this.floodDurationByCell=new Float32Array(n);}
 reset(n=0){this.accumulator=0;for(const k of Object.keys(this.series))this.series[k]=new MetricSeries(k);this.resetHeatmaps(n);}
 sample(dt,app){this.accumulator+=dt;if(this.accumulator<this.sampleInterval)return null;const sampleDt=this.accumulator;this.accumulator=0;const water=app.engine.water;let maxDepth=0,maxVelocity=0,flooded=0,floodVolume=0;
  for(let i=0;i<water.n;i++){const depth=Math.max(0,water.h[i]/PX),velocity=Math.abs(water.velocityAtIndex(i)/PX),x=(i+.5)*water.dx;maxDepth=Math.max(maxDepth,depth);maxVelocity=Math.max(maxVelocity,velocity);this.maxDepthByCell[i]=Math.max(this.maxDepthByCell[i]||0,depth);this.maxVelocityByCell[i]=Math.max(this.maxVelocityByCell[i]||0,velocity);if(depth>=.05&&x>=app.runup.baselineShorelineX){flooded++;floodVolume+=depth*water.dx;this.floodDurationByCell[i]=(this.floodDurationByCell[i]||0)+sampleDt;}}
  let buildingsFlooded=0,buildingsDamaged=0,buildingsDestroyed=0,populationExposed=0;for(const b of app.buildings.list()){const i=Math.max(0,Math.min(water.n-1,Math.floor(b.x/water.dx))),depth=water.h[i]/PX;if(depth>=.1){buildingsFlooded++;populationExposed+=Number(b.occupants||b.capacity||0);}if(b.integrityRatio<.98)buildingsDamaged++;if(b.integrity<=0)buildingsDestroyed++;}
  const urbanCells=Math.max(1,Math.floor((water.n*water.dx-app.runup.baselineShorelineX)/water.dx)),floodedArea=flooded/urbanCells,roadLengthFlooded=app.floodZones.snapshot().filter(z=>z.level!=="DRY").length*.8,powerFailures=app.buildings.list().filter(b=>b.type==="POWER_PLANT"&&!b.operational).length,defensesFailed=app.constructions.list().filter(c=>!c.operational).length;
  const values={waveHeight:app.disasterController.current.waveHeight,maxWaterDepth:maxDepth,floodedArea,floodVolume,maxVelocity,erodedVolume:app.engine.terrain.erodedCells*Math.pow(app.engine.terrain.cellSize/PX,2),depositedVolume:app.engine.erosion.totalSedimentDeposited,buildingsFlooded,buildingsDamaged,buildingsDestroyed,populationExposed,roadLengthFlooded,powerFailures,defensesFailed},time=app.runner.clock.elapsedSeconds;for(const [k,v] of Object.entries(values))this.series[k].push(time,v);return values;
 }
 latest(){return Object.fromEntries(Object.entries(this.series).map(([k,s])=>[k,s.latest]));}
 finalize(app){return ImpactAnalyzer.analyze(this,app);}
 serializeHeatmaps(){return {maxDepth:Array.from(this.maxDepthByCell),maxVelocity:Array.from(this.maxVelocityByCell),floodDuration:Array.from(this.floodDurationByCell)};}
 snapshot(){return {latest:this.latest(),peaks:Object.fromEntries(Object.entries(this.series).map(([k,s])=>[k,s.peak]))};}
}
