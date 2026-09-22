function severityLabel(level) {
  const labels = {
    DRY: "Seco",
    WET: "Molhado",
    FLOODED: "Alagado",
    TRAFFIC: "Trânsito comprometido",
    BUILDINGS: "Edificações afetadas",
    SEVERE: "Severo",
    STRUCTURAL: "Risco estrutural"
  };
  return labels[level] || level;
}

export function FloodPanel({ snapshot }) {
  const zones = snapshot?.floodZones || [];
  const front = snapshot?.floodFront;
  const urban = snapshot?.urbanFlood;

  return (
    <section className="flood-panel">
      <div className="game-panel-title">ALAGAMENTO URBANO</div>

      {front && front.frontX > (snapshot?.runup?.baselineShorelineX || 0) + 4 && (
        <div className="flood-front-warning">
          <small>FRENTE DE ÁGUA</small>
          <strong>{Math.max(0, front.speed || 0).toFixed(2)} m/s</strong>
          <span>
            {front.distanceToHospital == null
              ? "Avançando sobre a cidade"
              : front.distanceToHospital > 0
                ? Math.round(front.distanceToHospital) + " m até o hospital"
                : "A água alcançou a região do hospital"}
          </span>
        </div>
      )}

      <div className="flood-summary">
        <span>Prédios afetados <b>{urban?.affectedBuildings || 0}</b></span>
        <span>População afetada <b>{urban?.populationAffected || 0}</b></span>
      </div>

      <div className="flood-zone-list">
        {zones.map((zone) => (
          <article className={"flood-zone " + zone.level.toLowerCase()} key={zone.id}>
            <div>
              <strong>{zone.name}</strong>
              <small>{severityLabel(zone.level)}</small>
            </div>
            <div className="flood-zone-depth">
              <b>{zone.waterDepth.toFixed(2)} m</b>
              <span>máx. {zone.maxWaterDepth.toFixed(2)} m</span>
            </div>
            <div className="flood-zone-meta">
              <span>{zone.floodedBuildings} prédios</span>
              <span>{zone.populationAffected} pessoas</span>
              <span>Via: {zone.roadStatus}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
