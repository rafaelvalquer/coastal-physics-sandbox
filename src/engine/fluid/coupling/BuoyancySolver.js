const RHO_WATER=1000,G=9.81,PX=48;
export class BuoyancySolver{
 static submergedFraction(body,surfaceY){const top=body.y-body.height/2,bottom=body.y+body.height/2;if(surfaceY>=bottom)return 0;if(surfaceY<=top)return 1;return Math.max(0,Math.min(1,(bottom-surfaceY)/Math.max(1e-6,body.height)));}
 static solve(body,surfaceY){const fraction=this.submergedFraction(body,surfaceY),widthM=body.width/PX,heightM=body.height/PX,volume=widthM*heightM*Math.max(.1,body.thicknessMeters||1)*fraction,force=RHO_WATER*G*volume;return {fraction,volume,force};}
}
