import { SpectralWaveGenerator } from "../../engine/fluid/waves/SpectralWaveGenerator.js";
import { WaveBoundary } from "../../engine/fluid/waves/WaveBoundary.js";
import { WaveGroupSystem } from "../../engine/fluid/waves/WaveGroupSystem.js";

const PX=48;

export class OffshoreWaveGenerator{
 constructor({water,surfaceWaves,seaState,eventBus}){
  Object.assign(this,{water,surfaceWaves,seaState,eventBus});this.time=0;this.previousElevation=0;this.crestCount=0;this.signature="";this.groupSystem=new WaveGroupSystem();this.generator=null;this.boundary=null;
 }
 configureFromState(state){
  const hs=Math.max(.05,Number(state.significantWaveHeight||.4)),tp=Math.max(2.5,Number(state.wavePeriod||6.5)),direction=Number(state.direction||90),seed=Math.max(1,Math.floor(Number(state.seed||state.stormSeed||48212))),signature=[hs.toFixed(3),tp.toFixed(3),direction.toFixed(1),seed].join(":");
  if(signature===this.signature)return;
  this.signature=signature;this.generator=new SpectralWaveGenerator({significantWaveHeight:hs,peakPeriod:tp,seed,direction});this.boundary=new WaveBoundary({generator:this.generator,direction});
 }
 update(dt){
  const state=this.seaState.state;this.configureFromState(state);this.time+=dt;const offshoreDepth=Math.max(.5,(this.water.h[0]||PX*5)/PX),sample=this.boundary.sample(this.time,offshoreDepth),group=this.groupSystem.update(this.generator,this.time),visualGain=state.visualWaveGain||1;
  this.water.setOffshoreBoundary?.({elevationPx:sample.elevationPx*group,velocityPx:sample.velocityPx,signal:sample.signal,groupIntensity:group,significantWaveHeightMeters:this.generator.significantWaveHeight,seed:this.generator.seed});
  this.surfaceWaves.setBoundaryForcing?.({amplitudePx:Math.min(14,Math.abs(sample.elevationPx)*.22+.8)*visualGain,signal:Math.max(-1.5,Math.min(1.5,sample.signal)),intensity:group});
  const rising=this.previousElevation<=0&&sample.elevationMeters>0;if(rising){this.crestCount++;this.eventBus?.emit("sea:wave-crest",{crest:this.crestCount,height:this.generator.significantWaveHeight*group,period:this.generator.peakPeriod,seed:this.generator.seed});}
  this.previousElevation=sample.elevationMeters;
 }
 serialize(){return {time:this.time,previousElevation:this.previousElevation,crestCount:this.crestCount,signature:this.signature};}
 hydrate(v={}){this.time=Number(v.time||0);this.previousElevation=Number(v.previousElevation||0);this.crestCount=Number(v.crestCount||0);this.signature="";}
}
