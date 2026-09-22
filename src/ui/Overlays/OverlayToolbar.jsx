import { useUI } from "../state/UIStore.jsx";

const ITEMS = [
  ["F1", "Água", "WATER"],
  ["F2", "Fluxo", "VELOCITY"],
  ["F3", "Ondas", "WAVE_ENERGY"],
  ["F4", "Erosão", "EROSION"],
  ["F5", "Sedimento", "SEDIMENT"],
  ["F6", "Saturação", "SATURATION"],
  ["F7", "Risco", "FLOOD_RISK"],
  ["F8", "Estruturas", "STRUCTURAL"],
  ["F9", "Energia", "POWER"],
  ["F10", "Evacuação", "EVACUATION"],
  ["F11", "Estrutural", "STRUCTURAL_PHYSICS"]
];

export function OverlayToolbar({ engine, snapshot }) {
  const { state, dispatch } = useUI();
  if (!state.overlayToolbarOpen) {
    return (
      <button className="overlay-collapsed" onClick={() => dispatch({ type: "TOGGLE_OVERLAYS" })}>
        F1–F11
      </button>
    );
  }

  return (
    <aside className="overlay-rail">
      <div className="overlay-rail-header">
        <span>Overlays</span>
        <button onClick={() => dispatch({ type: "TOGGLE_OVERLAYS" })}>×</button>
      </div>
      {ITEMS.map(([key, label, overlay], index) => (
        <button
          key={key}
          className={snapshot?.overlay === overlay ? "active" : ""}
          onClick={() => engine?.game?.setOverlayByIndex(index)}
          title={key + " · " + label}
        >
          <b>{key}</b>
          <span>{label}</span>
        </button>
      ))}
    </aside>
  );
}
