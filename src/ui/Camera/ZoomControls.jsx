export function ZoomControls({ engine, camera }) {
  const zoom = camera?.zoom || 1;
  return (
    <div className="zoom-controls">
      <button onClick={() => engine?.zoomCamera?.(1.15)} title="Aproximar">+</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button onClick={() => engine?.zoomCamera?.(1 / 1.15)} title="Afastar">−</button>
      <button onClick={() => engine?.focusGameplay?.()} title="Enquadrar gameplay">Home</button>
      <button onClick={() => engine?.focusCity?.()} title="Enquadrar cidade">Cidade</button>
      <button onClick={() => engine?.focusCoast?.()} title="Enquadrar costa">Costa</button>
    </div>
  );
}
