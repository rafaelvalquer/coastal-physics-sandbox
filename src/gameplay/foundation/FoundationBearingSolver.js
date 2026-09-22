export class FoundationBearingSolver {
  static solve({bearingCapacity=0,pileVertical=0,weight=0,buoyancy=0}={}){
    const resistance=Math.max(1,bearingCapacity+pileVertical*.35);
    const demand=Math.max(1,weight-buoyancy);
    const factor=resistance/demand;
    return {factor,resistance,demand,state:factor>=1.5?"SAFE":factor>=1.2?"WARNING":factor>=1?"CRITICAL":"FAILING"};
  }
}
