export class LabEditorRenderer{
 draw(ctx,app){
  if(app.runner.state!=="EDIT"&&app.runner.state!=="COMPLETED")return;
  const e=app.editor;
  ctx.save();
  for(const road of e.roads){ctx.strokeStyle="rgba(91,105,108,.72)";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(road.x1,road.y1);ctx.lineTo(road.x2,road.y2);ctx.stroke();ctx.strokeStyle="rgba(190,199,196,.5)";ctx.lineWidth=1;ctx.setLineDash([7,7]);ctx.stroke();ctx.setLineDash([]);}
  if(e.dragStart&&e.dragCurrent){ctx.strokeStyle="rgba(117,222,229,.95)";ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(e.dragStart.x,e.dragStart.y);ctx.lineTo(e.dragCurrent.x,e.dragCurrent.y);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
 }
}
