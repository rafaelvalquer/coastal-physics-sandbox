const PHASES = ["CALM", "FORECAST", "APPROACH", "BUILDUP", "PEAK", "DECAY", "RECOVERY"];

const LABELS = {
  CALM: "MAR CALMO",
  FORECAST: "RESSACA PREVISTA",
  APPROACH: "APROXIMAÇÃO",
  BUILDUP: "MAR SUBINDO",
  PEAK: "PICO DA RESSACA",
  DECAY: "AFASTAMENTO",
  RECOVERY: "RECUPERAÇÃO"
};

export function StormTimeline({ snapshot }) {
  const sea = snapshot?.sea;
  if (!sea) return null;

  const index = Math.max(0, PHASES.indexOf(sea.phase));
  const phaseProgress = Math.max(0, Math.min(1, sea.phaseProgress || 0));
  const overall = Math.min(1, (index + phaseProgress) / (PHASES.length - 1));

  return (
    <div className={"storm-timeline " + sea.phase.toLowerCase()}>
      <div className="storm-timeline-title">
        <div>
          <small>{sea.phase === "CALM" ? "CONDIÇÃO DO MAR" : "RESSACA"}</small>
          <strong>{LABELS[sea.phase] || sea.phase}</strong>
        </div>
        <div className="storm-wave-readout">
          <span>Hs {sea.significantWaveHeight.toFixed(1)} m</span>
          <span>Máx {sea.maximumWaveHeight.toFixed(1)} m</span>
        </div>
      </div>
      <div className="storm-progress">
        <span style={{ width: Math.round(overall * 100) + "%" }} />
      </div>
      <div className="storm-timeline-footer">
        <span>
          {sea.hoursToPeak != null && sea.hoursToPeak > 0
            ? sea.hoursToPeak.toFixed(1) + " h até o pico"
            : sea.phase === "PEAK"
              ? "Pico em andamento"
              : sea.phase === "CALM"
                ? "Ondas contínuas de " + sea.significantWaveHeight.toFixed(1) + " m"
                : "Monitoramento costeiro ativo"}
        </span>
        <span>Nível {sea.totalLevel >= 0 ? "+" : ""}{sea.totalLevel.toFixed(2)} m</span>
      </div>
    </div>
  );
}
