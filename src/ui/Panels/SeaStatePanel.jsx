function meter(value, digits = 1) {
  return Number(value || 0).toFixed(digits) + " m";
}

export function SeaStatePanel({ snapshot }) {
  const sea = snapshot?.sea;
  if (!sea) return null;

  return (
    <section className="sea-state-panel">
      <div className="game-panel-title">CONDIÇÃO DO MAR</div>
      <div className="sea-energy">
        <div>
          <small>Estado</small>
          <strong>{sea.phase}</strong>
        </div>
        <div className="sea-energy-bar">
          <span style={{ width: Math.round((sea.energy || 0) * 100) + "%" }} />
        </div>
      </div>
      <div className="game-data-list">
        <span>Onda significativa</span><b>{meter(sea.significantWaveHeight)}</b>
        <span>Onda máxima</span><b>{meter(sea.maximumWaveHeight)}</b>
        <span>Período</span><b>{Number(sea.wavePeriod || 0).toFixed(1)} s</b>
        <span>Maré</span><b>{sea.tide >= 0 ? "+" : ""}{meter(sea.tide)}</b>
        <span>Storm surge</span><b>{sea.stormSurge >= 0 ? "+" : ""}{meter(sea.stormSurge)}</b>
        <span>Nível total</span><b>{sea.totalLevel >= 0 ? "+" : ""}{meter(sea.totalLevel)}</b>
        <span>Grupo de ondas</span><b>{Math.round((sea.groupIntensity || 1) * 100)}%</b>
        <span>Direção</span><b>Oceano → cidade</b>
      </div>
    </section>
  );
}
