const PRESETS=[["moderate-storm","Moderada"],["severe-storm","Severa"],["extreme-storm","Extrema"],["extreme-rain","Chuva extrema"],["extreme-tide","Maré extrema"]];
export function PresetSelector({onSelect}){return <div className="lab-preset-grid">{PRESETS.map(([id,label])=><button key={id} onClick={()=>onSelect(id)}>{label}</button>)}</div>;}
