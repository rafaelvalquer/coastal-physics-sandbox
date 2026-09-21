export function InspectorPanel({ inspection, engine }) {
  if (!inspection) return null;
  const building = inspection.building;

  function repair() {
    if (!building?.id) return;
    engine?.game?.commandBus?.execute("building:repair", {
      id: building.id,
      amount: 25,
      cost: 1500
    });
  }

  return (
    <div className="game-card inspector-card">
      <div className="game-panel-title">INSPECTOR</div>
      {building && (
        <>
          <div className="game-inspected-building">
            <strong>{building.type}</strong>
            <span>{building.id}</span>
          </div>
          <div className="game-data-list">
            <span>Integridade</span><b>{Math.round(building.integrityRatio * 100)}%</b>
            <span>Fundação</span><b>{Math.round(building.foundation.supportRatio * 100)}%</b>
            <span>Ocupação</span><b>{building.occupants} / {building.capacity}</b>
            <span>Estado</span><b>{building.operational ? "ONLINE" : "INOPERANTE"}</b>
          </div>
          {building.integrityRatio < 1 && (
            <button className="game-repair-button" onClick={repair}>Reparar $1.500</button>
          )}
        </>
      )}
      <div className="game-data-list terrain-probe">
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
