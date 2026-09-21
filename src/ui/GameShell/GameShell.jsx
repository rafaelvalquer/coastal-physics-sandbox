import { useCallback, useEffect, useRef, useState } from "react";
import { GameCanvas } from "../../components/GameCanvas.jsx";
import { TopHUD } from "../HUD/TopHUD.jsx";
import { ConstructionToolbar } from "../Construction/ConstructionToolbar.jsx";
import { ContextDrawer } from "../Panels/ContextDrawer.jsx";
import { SimulationLabDrawer } from "../SimulationLab/SimulationLabDrawer.jsx";
import { MiniMap } from "../Camera/MiniMap.jsx";
import { ZoomControls } from "../Camera/ZoomControls.jsx";
import { OverlayToolbar } from "../Overlays/OverlayToolbar.jsx";
import { NotificationCenter } from "../Notifications/NotificationCenter.jsx";
import { useUI } from "../state/UIStore.jsx";

export function GameShell() {
  const [engine, setEngine] = useState(null);
  const [stats, setStats] = useState(null);
  const { state, dispatch } = useUI();
  const lastSelection = useRef(null);

  const onEngineReady = useCallback((value) => {
    setEngine(value);
    if (value) {
      requestAnimationFrame(() => value.focusGameplay?.());
    }
  }, []);

  const onStats = useCallback((value) => setStats(value), []);

  useEffect(() => {
    const selected = stats?.gameplay?.selectedInspection;
    if (!selected) return;
    const signature = selected.building?.id || selected.x + ":" + selected.y;
    if (signature !== lastSelection.current) {
      lastSelection.current = signature;
      dispatch({ type: "OPEN_PANEL", panel: "INSPECTOR" });
    }
  }, [stats?.gameplay?.selectedInspection, dispatch]);

  const snapshot = stats?.gameplay;

  return (
    <main className="game-shell">
      <GameCanvas onEngineReady={onEngineReady} onStats={onStats} />

      <div className="simulation-status-chip">
        <span className="live-dot" />
        <span>SIMULAÇÃO 2D · FIXED STEP 120 Hz</span>
      </div>

      <TopHUD engine={engine} snapshot={snapshot} />

      <ContextDrawer engine={engine} stats={stats} />
      <SimulationLabDrawer engine={engine} stats={stats} />

      <OverlayToolbar engine={engine} snapshot={snapshot} />
      <ZoomControls engine={engine} camera={stats?.camera} />
      <MiniMap engine={engine} stats={stats} />

      <ConstructionToolbar engine={engine} snapshot={snapshot} />
      <NotificationCenter engine={engine} messages={snapshot?.messages || []} />

      {!state.minimapVisible && (
        <button
          className="restore-minimap"
          onClick={() => dispatch({ type: "TOGGLE_MINIMAP" })}
        >
          Mapa
        </button>
      )}

      <div className="navigation-hint">
        Scroll: zoom · Space + arrastar: mover · WASD/setas: mover · Home: enquadrar
      </div>

      {snapshot?.status && snapshot.status !== "RUNNING" && (
        <div className={"scenario-result " + snapshot.status.toLowerCase()}>
          <strong>{snapshot.status === "WON" ? "CENÁRIO CONCLUÍDO" : "CENÁRIO ENCERRADO"}</strong>
          <span>
            {snapshot.status === "WON"
              ? snapshot.scenarioName + " concluiu os objetivos estratégicos."
              : "Revise a estratégia costeira e tente novamente."}
          </span>
        </div>
      )}
    </main>
  );
}
