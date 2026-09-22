const BASE_KPA={Air:0,Areia:120,Solo:180,Argila:95,Cascalho:300,Rocha:1200,Concreto:1600};
export class SoilBearingSolver {
  static materialCapacity(materialName="Solo",moisture=0){const base=BASE_KPA[materialName]??140;const penalty=(materialName==="Rocha"||materialName==="Concreto")?1:Math.max(.35,1-moisture*.55);return base*penalty;}
  static pileCapacity(materialName,depth=2.5,diameter=.25,moisture=0){const bearing=this.materialCapacity(materialName,moisture)*1000;const area=Math.PI*Math.pow(diameter/2,2);const skin=Math.PI*diameter*depth;const factor=materialName==="Rocha"?2.5:materialName==="Cascalho"?1.45:.9;return {axial:bearing*area*factor+bearing*skin*.05,lateral:bearing*diameter*Math.min(depth,4)*.12*factor};}
}
