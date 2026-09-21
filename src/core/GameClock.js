const SPEEDS=[0,1,2,4,8];
export class GameClock {
  constructor({startDate="2027-01-01T08:30:00Z",minutesPerRealSecond=30}={}){ this.startDate=new Date(startDate); this.gameMinutes=0; this.timeScale=1; this.minutesPerRealSecond=minutesPerRealSecond; this.paused=false; }
  update(dt){ if(!this.paused) this.gameMinutes+=dt*this.minutesPerRealSecond*this.timeScale; }
  pause(){ this.paused=true; }
  resume(){ this.paused=false; }
  setSpeed(multiplier){ const v=Number(multiplier); if(!SPEEDS.includes(v)) throw new Error("Invalid game speed"); this.timeScale=v; this.paused=v===0; }
  getDate(){ return new Date(this.startDate.getTime()+this.gameMinutes*60000); }
  getHour(){ return this.getDate().getUTCHours(); }
  getDay(){ return this.getDate().getUTCDate(); }
  getMonth(){ return this.getDate().getUTCMonth()+1; }
  getYear(){ return this.getDate().getUTCFullYear(); }
  getElapsedDays(){ return this.gameMinutes/1440; }
  serialize(){ return {startDate:this.startDate.toISOString(),gameMinutes:this.gameMinutes,timeScale:this.timeScale,minutesPerRealSecond:this.minutesPerRealSecond,paused:this.paused}; }
  hydrate(v={}){ if(v.startDate)this.startDate=new Date(v.startDate); this.gameMinutes=Number(v.gameMinutes||0); this.timeScale=Number(v.timeScale??1); this.minutesPerRealSecond=Number(v.minutesPerRealSecond||30); this.paused=Boolean(v.paused); }
}
