export class GameLoop {
  constructor({gameplayDt=0.1}={}){ this.gameplayDt=gameplayDt; this.accumulator=0; }
  consume(dt,step){ this.accumulator+=dt; let count=0; while(this.accumulator>=this.gameplayDt&&count<10){ step(this.gameplayDt); this.accumulator-=this.gameplayDt; count++; } if(count===10)this.accumulator=0; return count; }
}
