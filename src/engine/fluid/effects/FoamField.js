export class FoamField{
 constructor(size){this.concentration=new Float32Array(size);}
 update(dt,water){const next=new Float32Array(this.concentration.length);for(let i=0;i<this.concentration.length;i++){const breaking=water.breaking[i]||0,source=breaking*dt*1.8,decay=Math.exp(-dt*(.28+.55*(1-breaking))),u=water.velocityAtIndex(i),shift=Math.sign(u);const target=Math.max(0,Math.min(this.concentration.length-1,i+shift));next[target]+=this.concentration[i]*decay*.35;next[i]+=this.concentration[i]*decay*.65+source;}for(let i=0;i<next.length;i++)this.concentration[i]=Math.max(0,Math.min(1,next[i]));return this.concentration;}
}
