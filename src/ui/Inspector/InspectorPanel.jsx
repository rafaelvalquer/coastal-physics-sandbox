export function InspectorPanel({ inspection, engine }) {
  if (!inspection) {
    return <p className="inspector-empty">Clique em um prédio, defesa ou terreno para inspecionar.</p>;
  }

  const building = inspection.building;
  const construction = inspection.construction;
  const effectiveness = construction?.effectiveness;

  function repairBuilding() {
    if (!building?.id) return;
    engine?.game?.commandBus?.execute("building:repair", {
      id: building.id,
      amount: 25,
      cost: 1500
    });
  }

  function repairDefense() {
    if (!construction?.id) return;
    engine?.game?.commandBus?.execute("construction:repair", {
      id: construction.id,
      amount: 0.25,
      cost: 1200
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
      {construction && (
        <section className="defense-inspector">
          <div className="game-inspected-building">
            <strong>{construction.type}</strong>
            <span>{construction.id}</span>
          </div>

          <div className="game-data-list">
            <span>Condição</span><b>{Math.round((construction.condition || 0) * 100)}%</b>
            <span>Comprimento</span><b>{construction.length} m</b>
            <span>Fundação exposta</span><b>{Math.round((construction.foundationExposure || 0) * 100)}%</b>
            <span>Estado</span><b>{construction.operational ? "OPERACIONAL" : "FALHA"}</b>
            <span>Overtopping</span><b>{construction.overtopping?.active ? "ATIVO" : "não"}</b>
          </div>

          {effectiveness && (
            <>
              <div className={"defense-risk " + effectiveness.riskLabel.toLowerCase()}>
                <small>RISCO DE ULTRAPASSAGEM</small>
                <strong>{Math.round(effectiveness.overtoppingRisk * 100)}%</strong>
                <div><span style={{ width: Math.round(effectiveness.overtoppingRisk * 100) + "%" }} /></div>
              </div>
              <div className="game-data-list">
                <span>Redução de onda</span><b>{Math.round(effectiveness.waveReduction * 100)}%</b>
                <span>Altura remanescente</span><b>{effectiveness.remainingHeight.toFixed(1)} m</b>
                <span>Risco da fundação</span><b>{Math.round(effectiveness.foundationRisk * 100)}%</b>
                <span>Reflexão</span><b>{Math.round(effectiveness.reflection * 100)}%</b>
              </div>
            </>
          )}

          {construction.condition < 1 && (
            <button className="game-repair-button" onClick={repairDefense}>Reparar defesa $1.200</button>
          )}
        </section>
      )}

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
              <button className="game-repair-button" onClick={repairBuilding}>Reparar $1.500</button>
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
        <span>Água</span><b>{inspection.depth.toFixed(2)} m</b>
        <span>Velocidade</span><b>{inspection.velocity.toFixed(2)} m/s</b>
        <span>Saturação</span><b>{Math.round(inspection.moisture * 100)}%</b>
        <span>Pressão</span><b>{Math.round(inspection.pressure)} Pa</b>
        <span>Sedimento</span><b>{inspection.sediment.toFixed(2)}</b>
      </div>
    </div>
  );
}
