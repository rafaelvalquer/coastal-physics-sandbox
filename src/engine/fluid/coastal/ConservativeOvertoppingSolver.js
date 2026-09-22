const PX=48,G=9.81;
export class ConservativeOvertoppingSolver{
 static estimate({water,seawardIndex,landwardIndex,crestElevationPx,widthMeters=1,dt}){
  const si=Math.max(0,Math.min(water.n-1,seawardIndex)),li=Math.max(0,Math.min(water.n-1,landwardIndex)),eta=water.bed[si]+water.h[si],headPx=Math.max(0,eta-crestElevationPx),headM=headPx/PX;if(headM<=0)return {discharge:0,volume:0,transferredPx:0};
  const discharge=.55*widthMeters*Math.sqrt(2*G)*Math.pow(headM,1.5),volume=Math.max(0,discharge*dt),dxM=water.dx/PX,maxVolume=water.h[si]/PX*dxM*widthMeters,actual=Math.min(volume,maxVolume),depthMeters=actual/(Math.max(.001,dxM*widthMeters)),dhPx=depthMeters*PX;return {discharge,volume:actual,transferredPx:Math.min(water.h[si],dhPx),seawardIndex:si,landwardIndex:li};
 }
 static transfer(args){const r=this.estimate(args);if(r.transferredPx>0){args.water.h[r.seawardIndex]-=r.transferredPx;args.water.h[r.landwardIndex]+=r.transferredPx;}return r;}
}
