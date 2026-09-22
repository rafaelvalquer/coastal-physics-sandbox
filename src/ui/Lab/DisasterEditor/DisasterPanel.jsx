import { OceanControls } from "./OceanControls.jsx";import { AtmosphereControls } from "./AtmosphereControls.jsx";import { EnvironmentControls } from "./EnvironmentControls.jsx";import { PresetSelector } from "./PresetSelector.jsx";
export function DisasterPanel({engine,snapshot}){
 const experiment=snapshot?.experiment?.experiment; if(!experiment)return null; const d=experiment.disaster,e=experiment.environment;
 const change=partial=>engine?.game?.commandBus?.execute("lab:disaster",{partial});
 const env=partial=>engine?.game?.commandBus?.execute("lab:environment",{partial});
 return <aside className="lab-disaster-panel">
  <div className="lab-panel-heading"><div><small>EXTREME EVENT</small><strong>Desastre</strong></div><span>{snapshot?.disaster?.phase||"EDIT"}</span></div>
  <div className="lab-panel-scroll">
   <div className="lab-group-title">PRESETS</div><PresetSelector onSelect={id=>engine?.game?.commandBus?.execute("lab:preset",{id})}/>
   <OceanControls disaster={d} onChange={change}/>
   <AtmosphereControls disaster={d} onChange={change}/>
   <EnvironmentControls environment={e} onChange={env}/>
   <label className="lab-range"><div><span>Duração do evento</span><b>{Math.round(d.duration)} min</b></div><input type="range" min="30" max="360" step="15" value={d.duration} onChange={x=>change({duration:Number(x.target.value)})}/></label>
  </div>
  <button className="lab-run-big" onClick={()=>engine?.game?.commandBus?.execute("lab:run")}>▶ SIMULAR DESASTRE</button>
 </aside>;
}
