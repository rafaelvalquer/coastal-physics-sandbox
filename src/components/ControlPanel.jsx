import { useEffect, useMemo, useState } from 'react';
import { TOOLS } from '../engine/world/constants.js';
import { Metric } from './Metric.jsx';

const tools = [
  [TOOLS.INSPECT, 'Inspecionar', '⌖'],
  [TOOLS.IMPULSE, 'Impacto', '≈'],
  [TOOLS.DIG, 'Escavar', '−'],
  [TOOLS.SAND, 'Areia', 'S'],
  [TOOLS.SOIL, 'Terra', 'T'],
  [TOOLS.ROCK, 'Rocha', 'R'],
  [TOOLS.CONCRETE, 'Concreto', 'C'],
  [TOOLS.DEBRIS, 'Destroço', '▰']
];

function formatTime(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ControlPanel({ engine, stats }) {
  const [tool, setTool] = useState(TOOLS.IMPULSE);
  const [brush, setBrush] = useState(2);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [env, setEnv] = useState({ wind: 8, gustiness: 0.28, rain: 0, tide: 0 });
  const [debug, setDebug] = useState({ grid: false, velocity: false, pressure: false, sediment: false, moisture: false });
  const [presets, setPresets] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/presets').then((r) => r.json()).then(setPresets).catch(() => setPresets([]));
  }, []);

  useEffect(() => {
    if (!engine) return;
    engine.setTool(tool);
    engine.setBrushSize(brush);
    engine.setRunning(running);
    engine.setSimulationSpeed(speed);
    engine.setEnvironment(env);
    for (const [key, value] of Object.entries(debug)) engine.setDebug(key, value);
  }, [engine, tool, brush, running, speed, env, debug]);

  const inspection = stats?.inspection;
  const volume = useMemo(() => Math.round((stats?.waterVolume || 0) / 1000), [stats?.waterVolume]);
  const energy = useMemo(() => Math.round((stats?.waveEnergy || 0) / 100000), [stats?.waveEnergy]);

  const setEnvironmentValue = (key, value) => setEnv((old) => ({ ...old, [key]: Number(value) }));

  const applyPreset = (preset) => {
    const next = { wind: preset.wind, gustiness: preset.gustiness, rain: preset.rain, tide: preset.tide };
    setEnv(next);
    engine?.setEnvironment(next);
    setStatus(`Preset: ${preset.name}`);
  };

  const save = async () => {
    if (!engine) return;
    setStatus('Salvando...');
    try {
      const response = await fetch('/api/save/slot-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(engine.serialize())
      });
      if (!response.ok) throw new Error('Falha ao salvar');
      setStatus('Mundo salvo no slot 1');
    } catch {
      setStatus('Não foi possível salvar. Verifique o servidor Node.');
    }
  };

  const load = async () => {
    if (!engine) return;
    setStatus('Carregando...');
    try {
      const response = await fetch('/api/save/slot-1');
      if (!response.ok) throw new Error('Save não encontrado');
      const payload = await response.json();
      engine.hydrate(payload.state);
      const a = engine.atmosphere;
      setEnv({ wind: a.wind, gustiness: a.gustiness, rain: a.rain, tide: a.tide });
      setStatus('Mundo carregado');
    } catch {
      setStatus('Nenhum save disponível no slot 1');
    }
  };

  return (
    <aside className="control-panel">
      <header className="brand-block">
        <div className="brand-mark">CP</div>
        <div>
          <h1>Coastal Physics</h1>
          <p>Sandbox físico costeiro</p>
        </div>
      </header>

      <div className="transport-row">
        <button className="primary" onClick={() => setRunning((v) => !v)}>{running ? 'Pausar' : 'Executar'}</button>
        {[0.5, 1, 2].map((v) => (
          <button key={v} className={speed === v ? 'active' : ''} onClick={() => setSpeed(v)}>{v}×</button>
        ))}
        <span className="sim-clock">{formatTime(stats?.simTime)}</span>
      </div>

      <section>
        <h2>Ferramentas</h2>
        <div className="tool-grid">
          {tools.map(([id, label, icon]) => (
            <button key={id} className={tool === id ? 'tool active' : 'tool'} onClick={() => setTool(id)} title={label}>
              <b>{icon}</b><span>{label}</span>
            </button>
          ))}
        </div>
        <label className="range-row">
          <span>Pincel <b>{brush}</b></span>
          <input type="range" min="1" max="7" value={brush} onChange={(e) => setBrush(e.target.value)} />
        </label>
      </section>

      <section>
        <div className="section-title-row"><h2>Atmosfera e oceano</h2><button className="mini" onClick={() => engine?.triggerStormWave()}>Pulso de onda</button></div>
        <label className="range-row">
          <span>Vento <b>{env.wind.toFixed(1)} m/s</b></span>
          <input type="range" min="-30" max="30" step="0.5" value={env.wind} onChange={(e) => setEnvironmentValue('wind', e.target.value)} />
        </label>
        <label className="range-row">
          <span>Rajadas <b>{Math.round(env.gustiness * 100)}%</b></span>
          <input type="range" min="0" max="1" step="0.01" value={env.gustiness} onChange={(e) => setEnvironmentValue('gustiness', e.target.value)} />
        </label>
        <label className="range-row">
          <span>Chuva <b>{env.rain.toFixed(0)} mm/h</b></span>
          <input type="range" min="0" max="120" step="1" value={env.rain} onChange={(e) => setEnvironmentValue('rain', e.target.value)} />
        </label>
        <label className="range-row">
          <span>Maré <b>{env.tide >= 0 ? '+' : ''}{env.tide.toFixed(1)} m</b></span>
          <input type="range" min="-1.5" max="2.2" step="0.05" value={env.tide} onChange={(e) => setEnvironmentValue('tide', e.target.value)} />
        </label>
        <div className="preset-row">
          {presets.map((p) => <button key={p.id} onClick={() => applyPreset(p)}>{p.name}</button>)}
        </div>
      </section>

      <section>
        <h2>Telemetria</h2>
        <div className="metric-grid">
          <Metric label="FPS" value={Math.round(stats?.fps || 0)} />
          <Metric label="Volume" value={volume} unit=" ku" />
          <Metric label="Energia de onda" value={energy} unit=" ×10⁵" />
          <Metric label="Sedimento" value={(stats?.sediment || 0).toFixed(1)} />
          <Metric label="Células erodidas" value={stats?.erodedCells || 0} />
          <Metric label="Corpos" value={stats?.bodies || 0} />
        </div>
      </section>

      <section>
        <h2>Debug físico</h2>
        <div className="debug-grid">
          {Object.entries({ grid: 'Grid', velocity: 'Velocidade', pressure: 'Pressão', sediment: 'Sedimento', moisture: 'Umidade' }).map(([key, label]) => (
            <label key={key} className="check-row">
              <input type="checkbox" checked={debug[key]} onChange={(e) => setDebug((d) => ({ ...d, [key]: e.target.checked }))} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="inspection">
        <h2>Sonda</h2>
        {inspection ? (
          <div className="inspection-grid">
            <span>Posição</span><b>{inspection.x}, {inspection.y}</b>
            <span>Material</span><b>{inspection.material}</b>
            <span>Integridade</span><b>{Math.round(inspection.integrity * 100)}%</b>
            <span>Umidade</span><b>{Math.round(inspection.moisture * 100)}%</b>
            <span>Profundidade</span><b>{inspection.depth.toFixed(2)} m</b>
            <span>Velocidade</span><b>{inspection.velocity.toFixed(2)} m/s</b>
            <span>Pressão</span><b>{Math.round(inspection.pressure / 1000)} kPa</b>
            <span>Sedimento</span><b>{inspection.sediment.toFixed(2)}</b>
          </div>
        ) : <p className="muted">Mova o cursor sobre o mundo.</p>}
      </section>

      <div className="save-row">
        <button onClick={save}>Salvar</button>
        <button onClick={load}>Carregar</button>
        <button className="danger" onClick={() => { engine?.resetWorld(); setStatus('Mundo reiniciado'); }}>Reiniciar</button>
      </div>
      {status && <div className="status-line">{status}</div>}
    </aside>
  );
}
