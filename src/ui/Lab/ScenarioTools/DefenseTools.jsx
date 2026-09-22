export const DEFENSE_TOOLS=[
 ["CONCRETE_WALL","Muro","▮"],["RIPRAP","Enrocamento","◆"],["BREAKWATER","Quebra-mar","≋"],["DUNE","Duna","⌁"],["VEGETATION","Vegetação","♧"],["SANDBAG","Sacos de areia","▤"],["TEMP_BARRIER","Barreira móvel","▯"]
];
export const WATER_TOOLS=[["DRAINAGE","Dreno","⇣"],["CHANNEL","Canal","⌄"],["PUMP","Bomba","↺"]];
export function DefenseTools({selected,onSelect,water=false}){const tools=water?WATER_TOOLS:DEFENSE_TOOLS;return <div className="lab-tool-grid">{tools.map(([id,label,icon])=><button key={id} className={selected===id?"active":""} onClick={()=>onSelect(id)}><b>{icon}</b><span>{label}</span></button>)}</div>;}
