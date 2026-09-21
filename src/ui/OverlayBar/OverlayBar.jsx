const ITEMS = [
  ["F1", "Água"],
  ["F2", "Velocidade"],
  ["F3", "Ondas"],
  ["F4", "Erosão"],
  ["F5", "Sedimento"],
  ["F6", "Saturação"],
  ["F7", "Risco"],
  ["F8", "Estruturas"],
  ["F9", "Energia"],
  ["F10", "Evacuação"]
];

export function OverlayBar({ engine, snapshot }) {
  return (
    <div className="game-overlay-bar">
      {ITEMS.map(([key, label], index) => (
        <button
          key={key}
          className={snapshot?.overlay && engine?.game?.state?.overlay === engine?.game?.state?.overlay && snapshot.overlay === [
            "WATER","VELOCITY","WAVE_ENERGY","EROSION","SEDIMENT","SATURATION","FLOOD_RISK","STRUCTURAL","POWER","EVACUATION"
          ][index] ? "active" : ""}
          onClick={() => engine?.game?.setOverlayByIndex(index)}
          title={key + " — " + label}
        >
          <b>{key}</b><span>{label}</span>
        </button>
      ))}
    </div>
  );
}
