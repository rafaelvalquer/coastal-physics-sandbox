const PX=48;
export class LocalScourSystem{
 constructor({terrain,water}){Object.assign(this,{terrain,water});}
 updateAt(x,{widthPx=24,intensity=1,dt=.008}={}){
  const i=Math.max(0,Math.min(this.water.n-1,Math.floor(x/this.water.dx))),u=Math.abs(this.water.velocityAtIndex(i))/PX,breaking=this.water.breaking[i]||0;if(u<.35&&breaking<.1)return 0;let damageTotal=0;
  const radius=Math.max(1,Math.ceil(widthPx/this.terrain.cellSize));
  for(let dx=-radius;dx<=radius;dx++){const wx=x+dx*this.terrain.cellSize,cell=this.terrain.surfaceCellForWorldX(wx);if(cell.y>=this.terrain.rows)continue;const mat=this.terrain.getMaterial(cell.x,cell.y);if(!mat.solid||!Number.isFinite(mat.criticalShear))continue;const shear=Math.abs(this.water.bedShear?.[i]||0)*(1+breaking*1.8),excess=Math.max(0,shear-mat.criticalShear)/Math.max(.1,mat.criticalShear),damage=Math.min(.02,mat.erodibility*excess*intensity*dt*.8);if(damage>0){this.terrain.damageCell(cell.x,cell.y,damage);damageTotal+=damage;}}
  return damageTotal;
 }
}
