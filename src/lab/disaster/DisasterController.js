import { DisasterTimeline } from "./DisasterTimeline.js";import { getDisasterPreset } from "./presets/index.js";
const RAD=Math.PI/180;
export class DisasterController{
 constructor({engine,experiment,eventBus,seaState}){Object.assign(this,{engine,experiment,eventBus,seaState});this.current={};this.phase="EDIT";this.timeline=new DisasterTimeline(experiment.disaster.timeline,experiment.disaster);this.timeline.ensureDefault(experiment.disaster.duration,experiment.disaster);}
 rebuild(){const d=this.experiment.disaster;this.timeline=new DisasterTimeline(d.timeline,d);this.timeline.ensureDefault(d.duration,d);}
 configure(partial){Object.assign(this.experiment.disaster,partial);this.experiment.disaster.timeline=[];this.rebuild();return this.experiment.disaster;}
 applyPreset(id){const p=getDisasterPreset(id);if(!p)return null;this.experiment.disaster=p.create();this.rebuild();return this.experiment.disaster;}
 prepareEnvironment(){const target=this.experiment.environment.soilSaturation??.35,t=this.engine.terrain;for(let x=0;x<t.cols;x++){const top=t.columnTopCell(x);for(let y=top;y<Math.min(t.rows,top+12);y++){const idx=t.index(x,y);if(t.getMaterial(x,y).solid)t.moisture[idx]=target;}}}
 phaseFor(seconds){const total=Math.max(60,this.experiment.disaster.duration*60),p=Math.max(0,Math.min(1,seconds/total));if(p<.12)return "APPROACH";if(p<.42)return "BUILDUP";if(p<.68)return "PEAK";if(p<.9)return "DECAY";return "RECOVERY";}
 update(seconds){const raw=this.timeline.sample(seconds),waveDir=Math.max(.2,.35+.65*Math.max(0,Math.cos((raw.waveDirection-90)*RAD))),windDir=Math.cos((raw.windDirection-90)*RAD),group=1+Math.sin(seconds*.17)*.08+Math.sin(seconds*.043+1.7)*.05;this.phase=this.phaseFor(seconds);this.current={...raw,waveHeight:Math.max(.15,raw.waveHeight*waveDir),phase:this.phase,groupIntensity:group};
  this.engine.atmosphere.wind=(raw.windSpeed/3.6)*windDir;this.engine.atmosphere.gustiness=Math.min(.85,.18+raw.windSpeed/180);this.engine.atmosphere.rain=Math.max(0,raw.rainfall);this.engine.atmosphere.astronomicalTide=(raw.tide||0)+(this.experiment.environment.seaLevelOffset||0);this.engine.atmosphere.stormSurge=raw.stormSurge||0;this.engine.atmosphere.waveSetup=Math.max(0,(raw.waveHeight||0)*0.035);this.engine.atmosphere.tide=this.engine.atmosphere.astronomicalTide+this.engine.atmosphere.stormSurge+this.engine.atmosphere.waveSetup;this.engine.atmosphere.hydrologyTimeScale=120;
  const h=this.current.waveHeight,period=Math.max(3.5,raw.wavePeriod||7);this.seaState.state={phase:this.phase,phaseProgress:seconds/Math.max(1,this.experiment.disaster.duration*60),hoursToPeak:null,significantWaveHeight:h,maximumWaveHeight:h*1.55,wavePeriod:period,direction:raw.waveDirection||90,groupIntensity:group,irregularity:.16,tide:raw.tide||0,stormSurge:raw.stormSurge||0,totalLevel:(raw.tide||0)+(raw.stormSurge||0),energy:Math.min(1,h*h*period/55),visualWaveGain:h<.8?1.8:h<1.8?1.5:1.15,seed:this.experiment.map?.seed||48212,stormSeed:this.experiment.map?.seed||48212};
  return this.current;
 }
 snapshot(){return {current:{...this.current},phase:this.phase,keyframes:this.timeline.serialize()};}
}
