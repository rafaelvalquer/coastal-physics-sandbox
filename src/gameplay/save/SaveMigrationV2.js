export function migrateSaveToV2(value={}) {
  const version=Number(value.saveVersion||1);
  if(version>=2)return value;
  return {
    ...value,
    saveVersion:2,
    constructions:(value.constructions||[]).map((item)=>({...item,legacyAssembly:true})),
    structuralEngineering:{
      grid:{cellMeters:.5,cells:[]},
      blocks:[],
      graph:[],
      assemblies:[],
      foundation:[],
      workforce:{},
      jobs:[],
      resources:{}
    }
  };
}
