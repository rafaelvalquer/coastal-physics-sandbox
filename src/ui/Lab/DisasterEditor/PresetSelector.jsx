const PRESETS=[
 ["moderate-storm","Tempestade"],
 ["severe-storm","Ressaca severa"],
 ["extreme-storm","Extrema"],
 ["tsunami","Tsunami"],
 ["high-tide-rain","Maré + chuva"],
 ["extreme-rain","Chuva extrema"],
 ["extreme-tide","Maré extrema"]
];
export function PresetSelector({onSelect}){return <div className="lab-preset-grid">{PRESETS.map(([id,label])=><button key={id} onClick={()=>onSelect(id)}>{label}</button>)}</div>;}
