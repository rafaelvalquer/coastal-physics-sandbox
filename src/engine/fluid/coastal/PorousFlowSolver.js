export class PorousFlowSolver{
 static apply(water,indices,{permeability=.35,roughness=.8,dissipation=.65,dt}={}){
  const p=Math.max(.01,Math.min(1,permeability)),loss=(.25+roughness*1.15+dissipation*1.7)*(1-p),damping=Math.exp(-Math.max(0,dt)*loss);
  let dissipated=0;for(const i of indices){if(i<0||i>=water.n)continue;const before=water.q[i];water.q[i]*=damping;dissipated+=Math.abs(before-water.q[i]);}return {damping,dissipated};
 }
}
