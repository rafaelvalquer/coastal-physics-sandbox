import { useEffect, useMemo, useState } from "react";
import { TOOLS } from "../../engine/world/constants.js";
import { Metric } from "../../components/Metric.jsx";
import { useUI } from "../state/UIStore.jsx";

const tools = [
  [TOOLS.INSPECT, "Inspecionar", "⌖"],
  [TOOLS.IMPULSE, "Impacto", "≈"],
  [TOOLS.DIG, "Escavar", "−"],
  [TOOLS.SAND, "Areia", "S"],
  [TOOLS.SOIL, "Terra", "T"],
  [TOOLS.ROCK, "Rocha", "R"],
  [TOOLS.CONCRETE, "Concreto", "C"],
  [TOOLS.DEBRIS, "Destroço", "▰"]
];

export function SimulationLabDrawer({ engine, stats }) {
  const { state, dispatch } = useUI();
  const [tool, setTool] = useState(TOOLS.INSPECT);
  const [brush, setBrush] = useState(2);
  const [env, setEnv] = useState({ wind: 8, gustiness: 0.28, rain: 0, tide: 0 });
  const [debug, setDebug] = useState({
    grid: false,
    velocity: false,
    pressure: false,
    sediment: false,
    moisture: false
  });
  const [presets, setPresets] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/presets")
      .then((response) => response.json())
      .then(setPresets)
      .catch(() => setPresets([]));
  }, []);

  useEffect(() => {
    if (!engine) return;
    const atmosphere = engine.atmosphere;
    setEnv({
      wind: atmosphere.wind,
      gustiness: atmosphere.gustiness,
      rain: atmosphere.rain,
      tide: atmosphere.tide
    });
  }, [engine, state.simulationLabOpen]);

  const volume = useMemo(
    () => Math.round((stats?.waterVolume || 0) / 1000),
    [stats?.waterVolume]
  );
  const energy = useMemo(
    () => Math.round((stats?.waveEnergy || 0) / 100000),
    [stats?.waveEnergy]
  );

  if (!state.simulationLabOpen) return null;

  const chooseTool = (value) => {
    setTool(value);
    engine?.game?.clearConstruction?.();
    engine?.setTool?.(value);
  };

  const setBrushValue = (value) => {
    const next = Number(value);
    setBrush(next);
    engine?.setBrushSize?.(next);
  };

  const setEnvironmentValue = (key, value) => {
    const next = { ...env, [key]: Number(value) };
    setEnv(next);
    engine?.setEnvironment?.({ [key]: Number(value) });
  };

  const toggleDebug = (key, value) => {
    setDebug((current) => ({ ...current, [key]: value }));
    engine?.setDebug?.(key, value);
  };

  const applyPreset = (preset) => {
    const next = {
      wind: preset.wind,
      gustiness: preset.gustiness,
      rain: preset.rain,
      tide: preset.tide
    };
    setEnv(next);
    engine?.setEnvironment?.(next);
    setStatus("Preset aplicado: " + preset.name);
  };

  const save = async () => {
    if (!engine) return;
    setStatus("Salvando...");
    try {
      const response = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "dashboard-slot", state: engine.serialize() })
      });
      if (!response.ok) throw new Error();
      setStatus("Save atualizado.");
    } catch {
      setStatus("Falha ao salvar.");
    }
  };

  const load = async () => {
    if (!engine) return;
    setStatus("Carregando...");
    try {
      const response = await fetch("/api/saves/dashboard-slot");
      if (!response.ok) throw new Error();
      const payload = await response.json();
      engine.hydrate(payload.state);
      engine.focusGameplay?.();
      setStatus("Save carregado.");
    } catch {
      setStatus("Save não encontrado.");
    }
  };

  return (
    <aside className="simulation-lab-drawer">
      <header className="lab-header">
        <div>
          <small>SIMULATION LAB</small>
          <strong>Laboratório físico</strong>
        </div>
        <button onClick={() => dispatch({ type: "TOGGLE_LAB" })}>×</button>
      </header>

      <section className="lab-section">
        <h3>Ferramentas físicas</h3>
        <div className="lab-tool-grid">
          {tools.map(([id, label, icon]) => (
            <button
              key={id}
              className={tool === id ? "active" : ""}
              onClick={() => chooseTool(id)}
            >
              <b>{icon}</b><span>{label}</span>
            </button>
          ))}
        </div>
        <label className="lab-range">
          <span>Pincel <b>{brush}</b></span>
          <input
            type="range"
            min="1"
            max="7"
            value={brush}
            onChange={(event) => setBrushValue(event.target.value)}
          />
        </label>
      </section>

      <section className="lab-section">
        <div className="lab-section-title">
          <h3>Atmosfera e oceano</h3>
          <button onClick={() => engine?.triggerStormWave?.()}>Pulso de onda</button>
        </div>
        {[
          ["wind", "Vento", -30, 30, 0.5, "m/s"],
          ["gustiness", "Rajadas", 0, 1, 0.01, ""],
          ["rain", "Chuva", 0, 120, 1, "mm/h"],
          ["tide", "Maré", -1.5, 2.2, 0.05, "m"]
        ].map(([key, label, min, max, step, unit]) => (
          <label className="lab-range" key={key}>
            <span>
              {label}
              <b>{Number(env[key]).toFixed(key === "gustiness" ? 2 : 1)} {unit}</b>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={env[key]}
              onChange={(event) => setEnvironmentValue(key, event.target.value)}
            />
          </label>
        ))}
        <div className="lab-preset-row">
          {presets.map((preset) => (
            <button key={preset.id} onClick={() => applyPreset(preset)}>
              {preset.name}
            </button>
          ))}
        </div>
      </section>

      <section className="lab-section">
        <h3>Telemetria</h3>
        <div className="lab-metric-grid">
          <Metric label="FPS" value={Math.round(stats?.fps || 0)} />
          <Metric label="Volume" value={volume} unit=" ku" />
          <Metric label="Energia" value={energy} unit=" ×10⁵" />
          <Metric label="Sedimento" value={(stats?.sediment || 0).toFixed(1)} />
          <Metric label="Erodidas" value={stats?.erodedCells || 0} />
          <Metric label="Corpos" value={stats?.bodies || 0} />
        </div>
      </section>

      <section className="lab-section">
        <h3>Debug físico</h3>
        <div className="lab-debug-grid">
          {Object.entries({
            grid: "Grid",
            velocity: "Velocidade",
            pressure: "Pressão",
            sediment: "Sedimento",
            moisture: "Umidade"
          }).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={debug[key]}
                onChange={(event) => toggleDebug(key, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="lab-section">
        <h3>Mundo</h3>
        <div className="lab-save-row">
          <button onClick={save}>Salvar</button>
          <button onClick={load}>Carregar</button>
          <button
            className="danger"
            onClick={() => {
              engine?.resetWorld?.();
              engine?.focusGameplay?.();
              setStatus("Cenário reiniciado.");
            }}
          >
            Reiniciar
          </button>
        </div>
        {status && <p className="lab-status">{status}</p>}
      </section>
    </aside>
  );
}
