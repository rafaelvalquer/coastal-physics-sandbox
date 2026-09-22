export const TERRAIN_TOOLS=[
 ["RAISE","Elevar","↑"],["LOWER","Abaixar","↓"],["SMOOTH","Suavizar","≈"],["SAND","Areia","░"],["SOIL","Solo","▒"],["ROCK","Rocha","◆"],["CLAY","Argila","◫"],["GRAVEL","Cascalho","◇"],["SATURATE","Saturar","≈"],["DRY","Secar","☼"]
];
export function TerrainTools({selected,onSelect}){return <div className="lab-tool-grid">{TERRAIN_TOOLS.map(([id,label,icon])=><button key={id} className={selected===id?"active":""} onClick={()=>onSelect(id)}><b>{icon}</b><span>{label}</span></button>)}</div>;}
