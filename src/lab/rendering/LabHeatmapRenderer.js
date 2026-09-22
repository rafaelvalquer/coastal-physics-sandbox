const PX=48;
export const LAB_OVERLAYS=["MAX_FLOOD_DEPTH","MAX_VELOCITY","FLOOD_DURATION","WAVE_ENERGY","EROSION","BUILDING_DAMAGE"];

export class LabHeatmapRenderer{
 draw(ctx,app){
  const overlay=app.overlay;if(!overlay)return;
  const water=app.engine.water,metrics=app.metrics;
  ctx.save();
  if(["MAX_FLOOD_DEPTH","MAX_VELOCITY","FLOOD_DURATION"].includes(overlay)){
   for(let i=0;i<water.n;i++){
    let value=0,max=1;
    if(overlay==="MAX_FLOOD_DEPTH"){value=metrics.maxDepthByCell[i]||0;max=2;}
    else if(overlay==="MAX_VELOCITY"){value=metrics.maxVelocityByCell[i]||0;max=3;}
    else {value=metrics.floodDurationByCell[i]||0;max=30;}
    const a=Math.max(0,Math.min(.72,value/max*.72));if(a<=.01)continue;
    ctx.fillStyle=overlay==="MAX_VELOCITY"?`rgba(255,190,70,${a})`:`rgba(67,177,238,${a})`;
    const x=i*water.dx,y=water.surfaceYAtIndex(i);ctx.fillRect(x,y,water.dx+1,Math.max(4,water.h[i]));
   }
  }else if(overlay==="BUILDING_DAMAGE"){
   for(const b of app.buildings.list()){const damage=1-b.integrityRatio;if(damage<=.01)continue;ctx.fillStyle=`rgba(235,73,65,${Math.min(.75,.15+damage*.7)})`;ctx.fillRect(b.x-b.width/2,b.y-b.height,b.width,b.height);}
  }else if(overlay==="EROSION"){
   const t=app.engine.terrain,s=t.cellSize;for(let x=0;x<t.cols;x++){const y=t.columnTopCell(x);if(y>=t.rows)continue;const idx=t.index(x,y),integrity=t.integrity[idx]||0;if(integrity>.92)continue;ctx.fillStyle=`rgba(224,117,52,${Math.min(.65,(1-integrity)*.7)})`;ctx.fillRect(x*s,y*s,s,Math.max(s,16));}
  }else if(overlay==="WAVE_ENERGY"){
   for(let i=0;i<water.n;i+=2){const e=Math.min(1,Math.abs(water.velocityAtIndex(i))/110+(water.breaking[i]||0)*.5);if(e<.05)continue;ctx.fillStyle=`rgba(183,79,223,${e*.55})`;ctx.fillRect(i*water.dx,water.surfaceYAtIndex(i)-6,water.dx*2,12);}
  }
  ctx.restore();
 }
}
