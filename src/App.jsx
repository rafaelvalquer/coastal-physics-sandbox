import { useCallback, useState } from 'react';
import { GameCanvas } from './components/GameCanvas.jsx';
import { ControlPanel } from './components/ControlPanel.jsx';
import { GameHUD } from './ui/HUD/GameHUD.jsx';
import './styles.css';

export default function App() {
  const [engine, setEngine] = useState(null);
  const [stats, setStats] = useState(null);
  const handleEngineReady = useCallback((value) => setEngine(value), []);
  const handleStats = useCallback((value) => setStats(value), []);

  return (
    <main className="app-shell">
      <ControlPanel engine={engine} stats={stats} />
      <section className="viewport-shell">
        <div className="viewport-topbar">
          <span className="live-dot" />
          <span>SIMULAÇÃO 2D • FIXED STEP 120 Hz</span>
          <span className="physics-note">água rasa + erosão + sedimentos + granular + empuxo</span>
        </div>
        <GameCanvas onEngineReady={handleEngineReady} onStats={handleStats} />
        <GameHUD engine={engine} stats={stats} />
        <div className="canvas-hint">Clique para aplicar a ferramenta selecionada. Arraste para pintar ou escavar.</div>
      </section>
    </main>
  );
}
