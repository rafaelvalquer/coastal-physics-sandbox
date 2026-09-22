import { TimelineKeyframe } from "./TimelineKeyframe.js";
const F=["waveHeight","wavePeriod","tide","stormSurge","windSpeed","windDirection","rainfall"];
export class DisasterTimeline{
 constructor(k=[],fallback=null){this.fallback=fallback;this.setKeyframes(k);}
 setKeyframes(k=[]){this.keyframes=k.map(x=>x instanceof TimelineKeyframe?x:new TimelineKeyframe(x)).sort((a,b)=>a.time-b.time);}
 ensureDefault(durationMinutes,d){if(this.keyframes.length)return;const s=Math.max(60,durationMinutes*60),p=d||this.fallback||{};this.setKeyframes([{time:0,...p,waveHeight:Math.max(.4,p.waveHeight*.18),stormSurge:p.stormSurge*.1,windSpeed:p.windSpeed*.35,rainfall:p.rainfall*.2},{time:s*.28,...p,waveHeight:p.waveHeight*.55,stormSurge:p.stormSurge*.45,windSpeed:p.windSpeed*.7,rainfall:p.rainfall*.65},{time:s*.58,...p},{time:s*.78,...p,waveHeight:p.waveHeight*.75,stormSurge:p.stormSurge*.72,windSpeed:p.windSpeed*.78,rainfall:p.rainfall*.72},{time:s,...p,waveHeight:Math.max(.45,p.waveHeight*.22),stormSurge:p.stormSurge*.12,windSpeed:p.windSpeed*.4,rainfall:p.rainfall*.15}]);}
 sample(t){if(!this.keyframes.length)return {...(this.fallback?.serialize?.()||this.fallback||{})};if(t<=this.keyframes[0].time)return this.keyframes[0].serialize();const last=this.keyframes.at(-1);if(t>=last.time)return last.serialize();let a=this.keyframes[0],b=last;for(let i=1;i<this.keyframes.length;i++)if(this.keyframes[i].time>=t){a=this.keyframes[i-1];b=this.keyframes[i];break;}const f=(t-a.time)/Math.max(1e-9,b.time-a.time),v={time:t};for(const key of F)v[key]=a[key]+(b[key]-a[key])*f;return v;}
 serialize(){return this.keyframes.map(x=>x.serialize());}
}
