export function InspectorPanel({ inspection }) {
  if (!inspection) return null;
  return (
    <div className="game-card inspector-card">
      <div className="game-panel-title">INSPECTOR</div>
      <div className="game-data-list">
        <span>Material</span><b>{inspection.material}</b>
        <span>Profundidade</span><b>{inspection.depth.toFixed(2)} m</b>
        <span>Velocidade</span><b>{inspection.velocity.toFixed(2)} m/s</b>
        <span>Saturação</span><b>{Math.round(inspection.moisture * 100)}%</b>
        <span>Pressão</span><b>{Math.round(inspection.pressure)} Pa</b>
        <span>Sedimento</span><b>{inspection.sediment.toFixed(2)}</b>
      </div>
    </div>
  );
}
