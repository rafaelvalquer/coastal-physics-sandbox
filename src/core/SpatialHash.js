export class SpatialHash {
  constructor(cellSize=64){ this.cellSize=cellSize; this.cells=new Map(); }
  key(x,y){ return Math.floor(x/this.cellSize)+":"+Math.floor(y/this.cellSize); }
  clear(){ this.cells.clear(); }
  insert(item){ const k=this.key(item.x,item.y); if(!this.cells.has(k))this.cells.set(k,new Set()); this.cells.get(k).add(item); }
  query(x,y,r=64){ const out=new Set(); const n=Math.ceil(r/this.cellSize); const cx=Math.floor(x/this.cellSize),cy=Math.floor(y/this.cellSize); for(let yy=-n;yy<=n;yy++)for(let xx=-n;xx<=n;xx++)for(const it of this.cells.get((cx+xx)+":"+(cy+yy))||[])out.add(it); return [...out]; }
}
