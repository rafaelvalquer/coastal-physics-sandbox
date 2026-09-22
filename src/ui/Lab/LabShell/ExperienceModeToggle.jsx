export function ExperienceModeToggle({engine,mode="SIMULATOR"}){
 const setMode=value=>engine?.game?.commandBus?.execute("lab:experience-mode",{mode:value});
 return <div className="lab-experience-toggle" role="group" aria-label="Modo de jogo">
  <button className={mode==="SIMULATOR"?"active":""} onClick={()=>setMode("SIMULATOR")}>Simulador</button>
  <button className={mode==="CAMPAIGN"?"active":""} onClick={()=>setMode("CAMPAIGN")}>Campanha</button>
 </div>;
}
