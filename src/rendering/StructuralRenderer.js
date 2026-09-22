const COLORS={CONCRETE_BLOCK:"#aeb8bd",FOUNDATION_BLOCK:"#8f9aa0",GABION:"#7e827a",ROCK_UNIT:"#6e6b64",TETRAPOD:"#737b80",SANDBAG:"#b99b63",TEMP_BARRIER:"#789aa4"};
export class StructuralRenderer {
  draw(ctx,system){
    if(!system)return;
    for(const block of system.blocks.values()){
      const p=block.worldCenter(system.grid),w=block.width*48,h=block.height*48,progress=Math.max(.08,block.progress??1);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(block.rotation||0);ctx.globalAlpha=block.constructionState==="COMPLETED"?1:.35+.55*progress;
      ctx.fillStyle=COLORS[block.type]||"#aab4b9";ctx.strokeStyle=block.constructionState==="COMPLETED"?"rgba(21,33,38,.8)":"rgba(126,210,220,.85)";ctx.lineWidth=1.2;
      const visibleH=h*progress;ctx.fillRect(-w/2,h/2-visibleH,w,visibleH);ctx.strokeRect(-w/2,h/2-visibleH,w,visibleH);
      if(block.type==="GABION"){ctx.strokeStyle="rgba(42,48,45,.65)";for(let y=h/2-visibleH+5;y<h/2;y+=7){ctx.beginPath();ctx.moveTo(-w/2,y);ctx.lineTo(w/2,y);ctx.stroke();}}
      if(block.type==="ROCK_UNIT"||block.type==="TETRAPOD"){ctx.fillStyle="rgba(235,245,246,.25)";ctx.beginPath();ctx.arc(0,0,Math.min(w,h)*.16,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
    for(const e of system.foundation.elements.values()){
      const progress=Math.max(.05,e.progress??1);ctx.save();ctx.globalAlpha=.4+.6*progress;ctx.strokeStyle=e.kind==="ANCHOR"||e.kind==="TIEBACK"?"#d9b86d":"#84949c";ctx.lineWidth=3;
      if(e.kind==="PILE"){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x,e.y+(e.depth||2.5)*48*progress);ctx.stroke();}
      else if(e.kind==="ANCHOR"||e.kind==="TIEBACK"){const angle=(e.angle||30)*Math.PI/180,len=(e.length||5)*48*progress;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(angle)*len,e.y+Math.sin(angle)*len);ctx.stroke();ctx.beginPath();ctx.arc(e.x+Math.cos(angle)*len,e.y+Math.sin(angle)*len,4,0,Math.PI*2);ctx.fillStyle="#d9b86d";ctx.fill();}
      ctx.restore();
    }
  }
}
