export class BlockConnectionSystem {
  constructor({graph,grid,blocks}){Object.assign(this,{graph,grid,blocks});}
  inferType(a,b){
    if(!a||!b)return "CONTACT";
    if(["ROCK_UNIT","TETRAPOD"].includes(a.type)||["ROCK_UNIT","TETRAPOD"].includes(b.type))return "INTERLOCK";
    if((a.type.includes("CONCRETE")||a.type==="FOUNDATION_BLOCK")&&(b.type.includes("CONCRETE")||b.type==="FOUNDATION_BLOCK"))return "MORTAR";
    if(a.type==="GABION"&&b.type==="GABION")return "INTERLOCK";
    return "CONTACT";
  }
  connectBlock(block){
    const ids=new Set();
    for(const cell of block.occupiedCells()){
      for(const n of this.grid.neighbors(cell.x,cell.y)){
        if(n.blockId&&n.blockId!==block.id)ids.add(n.blockId);
      }
    }
    for(const id of ids){
      const other=this.blocks.get(id);
      if(other)this.graph.connect(block.id,other.id,this.inferType(block,other));
    }
  }
  breakWeakConnections(blockId,threshold=.45){
    for(const [id,c] of this.graph.connections){
      if((c.a===blockId||c.b===blockId)&&c.integrity<=threshold)this.graph.connections.delete(id);
    }
  }
}
