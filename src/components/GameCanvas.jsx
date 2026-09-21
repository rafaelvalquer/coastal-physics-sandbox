import { useEffect, useRef } from 'react';
import { GameEngine } from '../engine/GameEngine.js';

export function GameCanvas({ onEngineReady, onStats }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const engine = new GameEngine(canvasRef.current, onStats);
    onEngineReady(engine);
    return () => {
      onEngineReady(null);
      engine.destroy();
    };
  }, [onEngineReady, onStats]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Simulação física costeira" />;
}
