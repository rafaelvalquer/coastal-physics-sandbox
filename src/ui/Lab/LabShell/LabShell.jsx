import { useCallback,useState } from "react";import { GameCanvas } from "../../../components/GameCanvas.jsx";import { ScenarioToolbar } from "../ScenarioTools/ScenarioToolbar.jsx";import { DisasterPanel } from "../DisasterEditor/DisasterPanel.jsx";import { DisasterTimeline } from "../Timeline/DisasterTimeline.jsx";import { SimulationControls } from "../Simulation/SimulationControls.jsx";import { LiveMetrics } from "../Simulation/LiveMetrics.jsx";import { AnalysisScreen } from "../Analysis/AnalysisScreen.jsx";import { ChallengeBrowser } from "../Challenges/ChallengeBrowser.jsx";import { ChallengeHUD } from "../Challenges/ChallengeHUD.jsx";import { EventLog } from "../Analysis/EventLog.jsx";import { LabOverlayRail } from "./LabOverlayRail.jsx";import { LabInspector } from "./LabInspector.jsx";import { ExperienceModeToggle } from "./ExperienceModeToggle.jsx";

export function LabShell(){
 const [engine,setEngine]=useState(null),[stats,setStats]=useState(null),[challengesOpen,setChallengesOpen]=useState(false);
 const ready=useCallback(value=>{setEngine(value);if(value)requestAnimationFrame(()=>value.focusGameplay?.());},[]);
 const onStats=useCallback(value=>setStats(value),[]);const snapshot=stats?.gameplay,state=snapshot?.runner?.state||"EDIT",photo=snapshot?.state?.photoMode;
 const togglePhoto=()=>engine?.game?.commandBus?.execute("lab:photo");
 return <main className={"extreme-lab-shell "+(photo?"photo-mode":"")}>
  <GameCanvas onEngineReady={ready} onStats={onStats}/>
  {!photo&&<><header className="lab-topbar"><div className="lab-brand"><small>COASTAL PHYSICS</small><strong>EXTREME WEATHER LAB</strong><span>{snapshot?.experiment?.code||"—"}</span></div><ExperienceModeToggle engine={engine} mode={snapshot?.experienceMode}/><SimulationControls engine={engine} snapshot={snapshot} onChallenges={()=>setChallengesOpen(true)} onPhoto={togglePhoto}/></header>{snapshot?.experienceMode==="CAMPAIGN"&&<ChallengeHUD snapshot={snapshot}/>} 
   {(state==="EDIT"||state==="COMPLETED")&&!snapshot?.state?.analysisOpen&&<><ScenarioToolbar engine={engine} snapshot={snapshot}/><DisasterPanel engine={engine} snapshot={snapshot}/><DisasterTimeline engine={engine} snapshot={snapshot}/></>}
   {(state==="RUNNING"||state==="PAUSED"||state==="REPLAY")&&<><LiveMetrics snapshot={snapshot}/><aside className="lab-event-panel"><div className="lab-panel-heading"><div><small>EVENT LOG</small><strong>Eventos</strong></div><span>{snapshot?.events?.length||0}</span></div><EventLog engine={engine} events={snapshot?.events||[]}/></aside></>}
   <LabOverlayRail engine={engine} snapshot={snapshot}/><LabInspector inspection={snapshot?.selectedInspection}/>{snapshot?.state?.analysisOpen&&<AnalysisScreen engine={engine} snapshot={snapshot}/>}
   {challengesOpen&&snapshot?.experienceMode==="CAMPAIGN"&&<ChallengeBrowser engine={engine} snapshot={snapshot} onClose={()=>setChallengesOpen(false)}/>}
   <div className="lab-camera-controls"><button onClick={()=>engine?.zoomCamera?.(1.15)}>+</button><button onClick={()=>engine?.zoomCamera?.(1/1.15)}>−</button><button onClick={()=>engine?.fitWorld?.()}>Mapa</button><button onClick={()=>engine?.focusCoast?.()}>Costa</button></div>
   <div className="lab-nav-hint">Scroll: zoom · Space + arrastar: mover · WASD/setas: mover · Home: enquadrar</div></>}
  {photo&&<button className="photo-exit" onClick={togglePhoto}>Sair do Photo Mode</button>}
 </main>;
}
