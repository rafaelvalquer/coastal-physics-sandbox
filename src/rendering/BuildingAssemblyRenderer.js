const COLORS={LIGHT_FOOTING:"#8e989d",WOOD_FRAME:"#9a6d43",PRECAST_WALL:"#a9b7bd",FLOOR_SLAB:"#929da3",ROOF_PANEL:"#9e5d55"};
export class BuildingAssemblyRenderer{
 draw(ctx,system){
  if(!system)return;
  for(const assembly of system.assemblies.values()){
    if(assembly.fractured)continue;
    const center=assembly.centerOfMass;
    for(const block of assembly.blocks){
      if(block.integrity<=.01)continue;
      const raw=block.worldCenter(system.grid),rx=raw.x-center.x,ry=raw.y-center.y,cos=Math.cos(assembly.rotation||0),sin=Math.sin(assembly.rotation||0),x=center.x+rx*cos-ry*sin,y=center.y+rx*sin+ry*cos,w=block.width*48,h=block.height*48;
      ctx.save();ctx.translate(x,y);ctx.rotate(assembly.rotation||0);
      const integrity=Math.max(0,Math.min(1,block.integrity));
      ctx.fillStyle=COLORS[block.type]||"#aab4b9";ctx.globalAlpha=.52+.48*integrity;ctx.strokeStyle=integrity<.55?"#582f32":"rgba(24,38,44,.82)";ctx.lineWidth=1.2;
      ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);
      if(integrity<.78){ctx.strokeStyle="rgba(75,37,39,.9)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-w*.25,-h*.35);ctx.lineTo(w*.05,-h*.05);ctx.lineTo(-w*.05,h*.32);ctx.stroke();}
      ctx.restore();
    }
    if(assembly.collapseState==="FALLING"&&assembly.bounds){ctx.save();ctx.strokeStyle="rgba(226,113,76,.65)";ctx.setLineDash([4,4]);ctx.strokeRect(assembly.bounds.minX,assembly.bounds.minY,assembly.bounds.maxX-assembly.bounds.minX,assembly.bounds.maxY-assembly.bounds.minY);ctx.restore();}
  }
  for(const e of system.foundation.elements.values()){
    ctx.save();ctx.strokeStyle=e.kind==="PILE"?"rgba(102,122,132,.8)":"rgba(197,164,91,.8)";ctx.lineWidth=2.2;
    if(e.kind==="PILE"){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y+(e.depth||2.5)*48);ctx.stroke();}
    ctx.restore();
  }
 }
}
