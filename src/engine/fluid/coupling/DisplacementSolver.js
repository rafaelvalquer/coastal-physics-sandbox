const PX=48;
export class DisplacementSolver{
 static applyDelta(water,x,deltaVolumeM3,radius=4){
  if(!Number.isFinite(deltaVolumeM3)||Math.abs(deltaVolumeM3)<1e-9)return 0;
  const center=Math.max(0,Math.min(water.n-1,Math.floor(x/water.dx))),dxM=water.dx/PX,neighbors=[];let weightSum=0;
  for(let d=-radius;d<=radius;d++){if(d===0)continue;const i=center+d;if(i<0||i>=water.n)continue;const w=Math.exp(-(d*d)/(Math.max(1,radius)*1.25));neighbors.push([i,w]);weightSum+=w;}
  if(!neighbors.length)return 0;
  if(deltaVolumeM3>0){
   const centerAvailable=water.h[center]/PX*dxM;
   const moved=Math.min(deltaVolumeM3,centerAvailable*.85);
   const centerDropPx=(moved/dxM)*PX;water.h[center]=Math.max(0,water.h[center]-centerDropPx);
   for(const [i,w] of neighbors){const share=moved*w/weightSum;water.h[i]+=share/dxM*PX;}
   return moved;
  }
  const requested=-deltaVolumeM3;let available=0;for(const [i,w] of neighbors)available+=water.h[i]/PX*dxM*w/weightSum;const moved=Math.min(requested,available*.85);for(const [i,w] of neighbors){const share=moved*w/weightSum,drop=share/dxM*PX;water.h[i]=Math.max(0,water.h[i]-drop);}water.h[center]+=moved/dxM*PX;return -moved;
 }
}
