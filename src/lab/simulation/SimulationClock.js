export class SimulationClock{
 constructor({simulatedMinutesPerPhysicsSecond=2}={}){this.simulatedMinutesPerPhysicsSecond=simulatedMinutesPerPhysicsSecond;this.elapsedMinutes=0;}
 reset(){this.elapsedMinutes=0;} update(dt){this.elapsedMinutes+=dt*this.simulatedMinutesPerPhysicsSecond;return this.elapsedMinutes;}
 get elapsedSeconds(){return this.elapsedMinutes*60;}
 format(){const t=Math.max(0,Math.floor(this.elapsedMinutes)),h=Math.floor(t/60),m=t%60;return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0");}
}
