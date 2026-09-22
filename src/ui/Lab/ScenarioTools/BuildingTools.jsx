export const BUILDING_TOOLS=[
 ["HOUSE","Casa","⌂"],["BUILDING","Prédio","▥"],["HOSPITAL","Hospital","+"],["SCHOOL","Escola","▦"],["CITY_HALL","Prefeitura","▣"],["POWER_PLANT","Usina","⚡"],["PORT","Porto","⚓"],["WAREHOUSE","Armazém","▤"],["ROAD","Estrada","━"]
];
export function BuildingTools({selected,onSelect}){return <div className="lab-tool-grid">{BUILDING_TOOLS.map(([id,label,icon])=><button key={id} className={selected===id?"active":""} onClick={()=>onSelect(id)}><b>{icon}</b><span>{label}</span></button>)}</div>;}
