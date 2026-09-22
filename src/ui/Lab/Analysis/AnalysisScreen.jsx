import { useState } from "react";import { RunSummary } from "./RunSummary.jsx";import { FloodAnalysis } from "./FloodAnalysis.jsx";import { DamageAnalysis } from "./DamageAnalysis.jsx";import { ErosionAnalysis } from "./ErosionAnalysis.jsx";import { EventLog } from "./EventLog.jsx";import { RunComparison } from "../Comparison/RunComparison.jsx";
const TABS=["RESUMO","INUNDAÇÃO","DANOS","EROSÃO","INFRAESTRUTURA","TIMELINE","COMPARAÇÃO"];
export function AnalysisScreen({engine,snapshot}){
 const [tab,setTab]=useState("RESUMO"),result=snapshot?.result;if(!result)return null;
 const close=()=>engine?.game?.commandBus?.execute("lab:analysis",{open:false});
 const edit=()=>{engine?.game?.commandBus?.execute("lab:reset");engine?.game?.commandBus?.execute("lab:analysis",{open:false});};
 const run=()=>{engine?.game?.commandBus?.execute("lab:analysis",{open:false});engine?.game?.commandBus?.execute("lab:run");};
 return <div className="analysis-overlay"><section className="analysis-screen"><header><div><small>POST-DISASTER ANALYSIS</small><h2>{result.experimentName}</h2><span>Seed {result.seed} · {Math.round(result.durationMinutes)} min simulados</span></div><button onClick={close}>×</button></header><nav>{TABS.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav><div className="analysis-body">
  {tab==="RESUMO"&&<><RunSummary result={result}/><div className="before-after"><button className={snapshot?.state?.analysisView==="BEFORE"?"active":""} onClick={()=>engine?.game?.commandBus?.execute("lab:analysis",{open:true,view:"BEFORE"})}>ANTES</button><button className={snapshot?.state?.analysisView==="AFTER"?"active":""} onClick={()=>engine?.game?.commandBus?.execute("lab:analysis",{open:true,view:"AFTER"})}>DEPOIS</button></div></>}
  {tab==="INUNDAÇÃO"&&<FloodAnalysis result={result} engine={engine}/>}
  {tab==="DANOS"&&<DamageAnalysis result={result} engine={engine}/>}
  {tab==="EROSÃO"&&<ErosionAnalysis result={result} engine={engine}/>}
  {tab==="INFRAESTRUTURA"&&<div className="critical-list large">{(result.criticalInfrastructure||[]).map(i=><div key={i.id}><span>{i.type} · {i.id}</span><b>{i.operational?"operacional":"falhou"} · {Math.round((i.integrity||0)*100)}%</b></div>)}</div>}
  {tab==="TIMELINE"&&<EventLog engine={engine} events={result.events||[]}/>}
  {tab==="COMPARAÇÃO"&&<RunComparison comparison={snapshot?.comparison}/>}
 </div><footer><button onClick={()=>engine?.game?.commandBus?.execute("lab:replay")}>Replay</button><button onClick={edit}>Alterar cenário</button><button className="primary" onClick={run}>Run Again</button></footer></section></div>;
}
