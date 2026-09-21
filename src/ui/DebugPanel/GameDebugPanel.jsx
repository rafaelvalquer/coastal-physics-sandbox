export function GameDebugPanel({ engine, stats, snapshot }) {
  const buildings = Object.values(snapshot?.buildings || {});
  const damaged = buildings.filter((building) => building.integrityRatio < 0.8).length;

  return (
    <details className="game-card game-debug-panel">
      <summary>SIMULATION DEBUG</summary>
      <div className="game-data-list">
        <span>Physics seed</span><b>{engine?.game?.scenario?.seed || "—"}</b>
        <span>Weather seed</span><b>{engine?.game?.scenario?.seed || "—"}</b>
        <span>Wave Energy</span><b>{Math.round((stats?.waveEnergy || 0) / 1000)}</b>
        <span>Storm Phase</span><b>{snapshot?.stormPhase || "CALM"}</b>
        <span>Buildings</span><b>{buildings.length}</b>
        <span>Damaged</span><b>{damaged}</b>
        <span>Economy</span><b>{"$" + Math.round(snapshot?.balance || 0).toLocaleString("pt-BR")}</b>
        <span>Population</span><b>{snapshot?.population || 0}</b>
        <span>Events</span><b>{engine?.game?.eventBus?.emitted || 0}</b>
      </div>
    </details>
  );
}
