export function InspectorPanel({ inspection, engine }) {
  if (!inspection) {
    return <p className="inspector-empty">Clique em um prédio ou terreno para inspecionar.</p>;
  }

  const building = inspection.building;

  function repair() {
    if (!building?.id) return;
    engine?.game?.commandBus?.execute("building:repair", {
      id: building.id,
      amount: 25,
      cost: 1500
    });
  }

  function evacuate() {
    if (!building?.id) return;
    engine?.game?.commandBus?.execute("evacuation:building", {
      buildingId: building.id,
      type: "MANDATORY"
    });
  }

  function prioritizePower() {
    if (!building?.id) return;
    engine?.game?.commandBus?.execute("utility:prioritize-power", {
      buildingId: building.id
    });
  }

  const canPrioritize = ["HOSPITAL", "CITY_HALL", "POWER_PLANT", "PORT"].includes(building?.type);

  return (
    <div className="game-card inspector-card">
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

          <div className="inspector-actions">
            {building.integrityRatio < 1 && (
              <button className="game-repair-button" onClick={repair}>Reparar $1.500</button>
            )}
            {building.occupants > 0 && (
              <button onClick={evacuate}>Evacuar moradores</button>
            )}
            {canPrioritize && (
              <button onClick={prioritizePower}>Priorizar energia</button>
            )}
          </div>
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
