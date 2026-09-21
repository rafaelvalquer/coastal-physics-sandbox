import { BuildMenu } from "../BuildMenu/BuildMenu.jsx";
import { WeatherPanel } from "../WeatherPanel/WeatherPanel.jsx";
import { EconomyPanel } from "../EconomyPanel/EconomyPanel.jsx";
import { ObjectivePanel } from "../ObjectivePanel/ObjectivePanel.jsx";
import { InspectorPanel } from "../Inspector/InspectorPanel.jsx";
import { OverlayBar } from "../OverlayBar/OverlayBar.jsx";
import { CampaignPanel } from "../CampaignPanel/CampaignPanel.jsx";
import { GameDebugPanel } from "../DebugPanel/GameDebugPanel.jsx";

const SPEEDS = [0, 1, 2, 4, 8];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(date);
}

export function GameHUD({ engine, stats }) {
  const snapshot = stats?.gameplay;
  if (!snapshot) return null;

  const currentSpeed = engine?.game?.clock?.timeScale || 0;
  const lastMessage = snapshot.messages?.at(-1);

  return (
    <div className="game-hud">
      <div className="game-hud-top">
        <div className="game-hud-metric date">
          <small>PORTO ESPERANÇA</small>
          <strong>{formatDate(snapshot.date)}</strong>
        </div>
        <div className="game-hud-metric">
          <small>CAIXA</small>
          <strong>{"$" + Math.round(snapshot.balance).toLocaleString("pt-BR")}</strong>
        </div>
        <div className="game-hud-metric">
          <small>POPULAÇÃO</small>
          <strong>{snapshot.population}</strong>
        </div>
        <div className="game-hud-metric">
          <small>RESILIÊNCIA</small>
          <strong>{snapshot.resilience}%</strong>
        </div>
        <div className="game-speed">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              className={currentSpeed === speed ? "active" : ""}
              onClick={() => engine?.game?.setSpeed(speed)}
            >
              {speed === 0 ? "Ⅱ" : speed + "x"}
            </button>
          ))}
        </div>
      </div>

      <aside className="game-hud-right">
        <WeatherPanel snapshot={snapshot} />
        <EconomyPanel snapshot={snapshot} />
        <ObjectivePanel snapshot={snapshot} />
        <CampaignPanel engine={engine} snapshot={snapshot} />
        <InspectorPanel inspection={stats?.inspection} engine={engine} />
        <GameDebugPanel engine={engine} stats={stats} snapshot={snapshot} />
        <div className="game-card">
          <div className="game-panel-title">EMERGÊNCIA</div>
          <div className="game-action-row">
            <button onClick={() => engine?.game?.commandBus?.execute("evacuation:issue", { type: "VOLUNTARY" })}>
              Evacuação voluntária
            </button>
            <button onClick={() => engine?.game?.commandBus?.execute("evacuation:issue", { type: "MANDATORY" })}>
              Evacuação obrigatória
            </button>
          </div>
        </div>
      </aside>

      <div className="game-overlay-position">
        <OverlayBar engine={engine} snapshot={snapshot} />
      </div>

      <div className="game-hud-bottom">
        <BuildMenu engine={engine} snapshot={snapshot} />
      </div>

      {lastMessage && (
        <div className={"game-toast " + (lastMessage.type || "info")}>
          {lastMessage.message}
        </div>
      )}

      {snapshot.status !== "RUNNING" && (
        <div className={"game-end-state " + snapshot.status.toLowerCase()}>
          <strong>{snapshot.status === "WON" ? "CENÁRIO CONCLUÍDO" : "CENÁRIO ENCERRADO"}</strong>
          <span>
            {snapshot.status === "WON"
              ? "Porto Esperança resistiu ao ciclo planejado."
              : "Revise a estratégia costeira e tente novamente."}
          </span>
        </div>
      )}
    </div>
  );
}
