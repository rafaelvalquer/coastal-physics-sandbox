const ITEMS = [
  ["F1", "Água", "WATER"],
  ["F2", "Velocidade", "VELOCITY"],
  ["F3", "Ondas", "WAVE_ENERGY"],
  ["F4", "Erosão", "EROSION"],
  ["F5", "Sedimento", "SEDIMENT"],
  ["F6", "Saturação", "SATURATION"],
  ["F7", "Risco", "FLOOD_RISK"],
  ["F8", "Estruturas", "STRUCTURAL"],
  ["F9", "Energia", "POWER"],
  ["F10", "Evacuação", "EVACUATION"]
];

export function OverlayBar({ engine, snapshot }) {
  return (
    <div className="game-overlay-bar">
      {ITEMS.map(([key, label, overlay], index) => (
        <button
          key={key}
          className={snapshot?.overlay === overlay ? "active" : ""}
          onClick={() => engine?.game?.setOverlayByIndex(index)}
          title={key + " — " + label}
        >
          <b>{key}</b><span>{label}</span>
        </button>
      ))}
    </div>
  );
}
