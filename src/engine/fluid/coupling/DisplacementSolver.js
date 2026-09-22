const PX=48;
export class DisplacementSolver{
 static applyDelta(water,x,deltaVolumeM3,radius=4){
  if(!Number.isFinite(deltaVolumeM3)||Math.abs(deltaVolumeM3)<1e-9)return 0;
  const center=Math.max(0,Math.min(water.n-1,Math.floor(x/water.dx))),weights=[];let sum=0;
  for(let d=-radius;d<=radius;d++){const i=center+d;if(i<0||i>=water.n)continue;const w=Math.exp(-(d*d)/(Math.max(1,radius)*1.35));weights.push([i,w]);sum+=w;}
  const dxM=water.dx/PX;let applied=0;
  for(const [i,w] of weights){const dv=deltaVolumeM3*w/sum,dhMeters=dv/Math.max(.01,dxM);const dhPx=dhMeters*PX;const next=Math.max(0,water.h[i]+dhPx);applied+=(next-water.h[i])*dxM/PX;water.h[i]=next;}
  return applied;
 }
}
