import { CONSTRUCTION_TYPES } from "../../data/constructions.js";
import { TOOLS } from "../../engine/world/constants.js";
import { useUI } from "../state/UIStore.jsx";

const ITEMS = [
  ["CONCRETE_WALL", "Muro", "▥"],
  ["RIPRAP", "Enrocamento", "◆"],
  ["DUNE", "Duna", "⌁"],
  ["VEGETATION", "Vegetação", "⋀"],
  ["DRAINAGE", "Drenagem", "⇣"],
  ["BREAKWATER", "Quebra-mar", "≋"]
];

export function ConstructionToolbar({ engine, snapshot }) {
  const { state, dispatch } = useUI();
  const selected = snapshot?.selectedConstruction;
  const preview = snapshot?.constructionPreview;

  const inspect = () => {
    engine?.game?.clearConstruction?.();
    engine?.setTool?.(TOOLS.INSPECT);
    dispatch({ type: "OPEN_PANEL", panel: "INSPECTOR" });
  };

  const select = (type) => {
    if (!engine?.game) return;
    if (selected === type) engine.game.clearConstruction();
    else {
      engine.setTool?.(TOOLS.INSPECT);
      engine.game.selectConstruction(type, 20);
    }
  };

  return (
    <div className="construction-dock-wrap">
      {selected && (
        <div className={preview?.valid === false ? "construction-context invalid" : "construction-context"}>
          <strong>{ITEMS.find(([id]) => id === selected)?.[1] || selected}</strong>
          <span>20 m</span>
          <span>{"$" + Math.round((CONSTRUCTION_TYPES[selected]?.costPerMeter || 0) * 20).toLocaleString("pt-BR")}</span>
          {preview && <span>{preview.valid ? "Posição válida" : preview.reason}</span>}
          {preview?.soil?.material && <span>Solo: {preview.soil.material}</span>}
          {preview?.risk && <span>Risco: {preview.risk.toLowerCase()}</span>}
        </div>
      )}

      <nav className="construction-dock">
        <button className={!selected && state.activePanel === "INSPECTOR" ? "active" : ""} onClick={inspect} title="Inspecionar">
          <b>⌖</b><span>Inspecionar</span>
        </button>

        {ITEMS.map(([type, label, icon]) => (
          <button
            key={type}
            className={selected === type ? "active" : ""}
            onClick={() => select(type)}
            title={label + " · $" + CONSTRUCTION_TYPES[type].costPerMeter.toLocaleString("pt-BR") + "/m"}
          >
            <b>{icon}</b>
            <span>{label}</span>
          </button>
        ))}

        <span className="dock-separator" />

        <button className={state.activePanel === "CITY" ? "active" : ""} onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "CITY" })}>
          <b>▦</b><span>Cidade</span>
        </button>
        <button className={state.activePanel === "EMERGENCY" ? "active danger" : "danger"} onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "EMERGENCY" })}>
          <b>!</b><span>Emergência</span>
        </button>
        <button className={state.overlayToolbarOpen ? "active" : ""} onClick={() => dispatch({ type: "TOGGLE_OVERLAYS" })}>
          <b>◫</b><span>Overlays</span>
        </button>
      </nav>
    </div>
  );
}
