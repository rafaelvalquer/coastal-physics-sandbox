import { WeatherPanel } from "../WeatherPanel/WeatherPanel.jsx";
import { EconomyPanel } from "../EconomyPanel/EconomyPanel.jsx";
import { ObjectivePanel } from "../ObjectivePanel/ObjectivePanel.jsx";
import { InspectorPanel } from "../Inspector/InspectorPanel.jsx";
import { CampaignPanel } from "../CampaignPanel/CampaignPanel.jsx";
import { SeaStatePanel } from "./SeaStatePanel.jsx";
import { FloodPanel } from "./FloodPanel.jsx";
import { WorkforcePanel } from "../Workforce/WorkforcePanel.jsx";
import { useUI } from "../state/UIStore.jsx";

const TITLES = {
  CITY: "Cidade",
  WEATHER: "Clima e previsão",
  OBJECTIVES: "Objetivos",
  RESEARCH: "Campanha e pesquisa",
  INSPECTOR: "Inspector",
  EMERGENCY: "Emergência"
};

export function ContextDrawer({ engine, stats }) {
  const { state, dispatch } = useUI();
  const snapshot = stats?.gameplay;
  const panel = state.activePanel;
  if (!panel || !snapshot) return null;

  const inspection = snapshot.selectedInspection || stats?.inspection;

  return (
    <aside className="context-drawer">
      <header className="context-drawer-header">
        <div>
          <small>PAINEL CONTEXTUAL</small>
          <strong>{TITLES[panel] || panel}</strong>
        </div>
        <button onClick={() => dispatch({ type: "CLOSE_PANEL" })} aria-label="Fechar painel">×</button>
      </header>

      <div className="context-drawer-content">
        {panel === "CITY" && (
          <>
            <EconomyPanel snapshot={snapshot} />
            <WorkforcePanel engine={engine} snapshot={snapshot} />
            <FloodPanel snapshot={snapshot} />
          </>
        )}
        {panel === "WEATHER" && (
          <>
            <WeatherPanel snapshot={snapshot} engine={engine} />
            <SeaStatePanel snapshot={snapshot} />
          </>
        )}
        {panel === "OBJECTIVES" && <ObjectivePanel snapshot={snapshot} />}
        {panel === "RESEARCH" && <CampaignPanel engine={engine} snapshot={snapshot} />}
        {panel === "INSPECTOR" && (
          <InspectorPanel inspection={inspection} engine={engine} />
        )}
        {panel === "EMERGENCY" && (
          <div className="emergency-panel">
            <p>
              Emita ordens de evacuação usando a capacidade real da malha viária.
              Vias alagadas reduzem a velocidade e podem interromper rotas.
            </p>
            <button
              onClick={() => engine?.game?.commandBus?.execute("evacuation:issue", { type: "VOLUNTARY" })}
            >
              Evacuação voluntária
            </button>
            <button
              className="danger"
              onClick={() => engine?.game?.commandBus?.execute("evacuation:issue", { type: "MANDATORY" })}
            >
              Evacuação obrigatória
            </button>
            <div className="drawer-data-grid">
              <span>Evacuados</span><b>{snapshot.evacuated || 0}</b>
              <span>Desabrigados</span><b>{snapshot.homeless || 0}</b>
              <span>Energia</span><b>{snapshot.power?.available ? "Operacional" : "Crítica"}</b>
              <span>Água</span><b>{snapshot.waterUtility?.operational ? "Operacional" : "Crítica"}</b>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
