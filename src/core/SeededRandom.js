export class SeededRandom {
  constructor(seed="COASTAL"){ let h=2166136261; for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);} this.state=h>>>0||1; }
  next(){ let x=this.state; x^=x<<13; x^=x>>>17; x^=x<<5; this.state=x>>>0; return this.state/4294967296; }
  range(min,max){ return min+(max-min)*this.next(); }
  pick(items){ return items[Math.floor(this.next()*items.length)]; }
}
