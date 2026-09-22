import { useUI } from "../state/UIStore.jsx";

const SPEEDS = [0, 1, 2, 4, 8];

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function TopHUD({ engine, snapshot }) {
  const { state, dispatch } = useUI();
  if (!snapshot) return null;

  const speed = engine?.game?.clock?.timeScale || 0;
  const storm = snapshot.forecast;
  const sea = snapshot.sea;
  const alert = sea
    ? sea.phase + " · " + sea.significantWaveHeight.toFixed(1) + " m"
    : storm
      ? "Alerta costeiro · " + storm.confidence
      : "Condições estáveis";

  return (
    <header className="top-hud">
      <div className="top-hud-brand">
        <span className="compact-brand-mark">CP</span>
        <div>
          <strong>{snapshot.scenarioName || "Coastal Physics"}</strong>
          <small>{formatDate(snapshot.date)}</small>
        </div>
      </div>

      <div className="top-hud-metrics">
        <button className="hud-metric" onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "CITY" })}>
          <small>Caixa</small>
          <b>{"$" + Math.round(snapshot.balance || 0).toLocaleString("pt-BR")}</b>
        </button>
        <button className="hud-metric" onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "CITY" })}>
          <small>População</small>
          <b>{snapshot.population || 0}</b>
        </button>
        <button className="hud-metric" onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "OBJECTIVES" })}>
          <small>Resiliência</small>
          <b>{snapshot.resilience || 0}%</b>
        </button>
        <button className={storm ? "hud-alert warning" : "hud-alert"} onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "WEATHER" })}>
          <small>Clima</small>
          <b>{alert}</b>
        </button>
      </div>

      <nav className="top-hud-actions">
        <button className={state.activePanel === "CITY" ? "active" : ""} onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "CITY" })}>Cidade</button>
        <button className={state.activePanel === "OBJECTIVES" ? "active" : ""} onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "OBJECTIVES" })}>Objetivos</button>
        <button className={state.activePanel === "RESEARCH" ? "active" : ""} onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "RESEARCH" })}>Pesquisa</button>
        <button className={state.simulationLabOpen ? "active" : ""} onClick={() => dispatch({ type: "TOGGLE_LAB" })}>Laboratório</button>
      </nav>

      <div className="top-hud-speed">
        {SPEEDS.map((value) => (
          <button
            key={value}
            className={speed === value ? "active" : ""}
            onClick={() => engine?.game?.setSpeed(value)}
            title={value === 0 ? "Pausar" : "Velocidade " + value + "x"}
          >
            {value === 0 ? "Ⅱ" : value + "x"}
          </button>
        ))}
      </div>
    </header>
  );
}
