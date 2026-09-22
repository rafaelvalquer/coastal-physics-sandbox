export class StructuralPreviewRenderer {
  draw(ctx,game){
    const planner=game.structural?.planner;if(!planner?.selectedType||!game.engine.pointer?.inside)return;
    const preview=planner.preview({x:game.engine.pointer.x,y:game.engine.pointer.y});if(!preview)return;
    const size=24;ctx.save();ctx.strokeStyle=preview.valid?"rgba(83,220,157,.95)":"rgba(239,91,82,.95)";ctx.fillStyle=preview.valid?"rgba(83,220,157,.15)":"rgba(239,91,82,.14)";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.fillRect(preview.x-size/2,preview.y-size/2,size,size);ctx.strokeRect(preview.x-size/2,preview.y-size/2,size,size);
    if(preview.estimate?.centerOfMass){const c=preview.estimate.centerOfMass;ctx.setLineDash([]);ctx.fillStyle="#ffd86a";ctx.beginPath();ctx.arc(c.x,c.y,4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
