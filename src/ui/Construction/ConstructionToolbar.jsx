import { useState } from "react";
import { TOOLS } from "../../engine/world/constants.js";
import { useUI } from "../state/UIStore.jsx";
import { ToolCategoryMenu } from "./ToolCategoryMenu.jsx";
import { StructuralPreview } from "./StructuralPreview.jsx";
import { BlueprintPanel } from "./BlueprintPanel.jsx";

const CATEGORIES = [
  ["TERRAIN", "Terreno", "⛏"],
  ["FOUNDATION", "Fundação", "▰"],
  ["STRUCTURE", "Estrutura", "▥"],
  ["PROTECTION", "Proteção", "◆"],
  ["WATER", "Água", "⇣"],
  ["EMERGENCY", "Emergência", "!"]
];

export function ConstructionToolbar({ engine, snapshot }) {
  const { state, dispatch } = useUI();
  const [category, setCategory] = useState("STRUCTURE");
  const selectedType = snapshot?.selectedStructuralTool || snapshot?.selectedConstruction || null;
  const structuralPreview = snapshot?.structuralPreview;

  const inspect = () => {
    engine?.game?.commandBus?.execute("structural:cancel");
    engine?.game?.commandBus?.execute("construction:cancel");
    engine?.setTool?.(TOOLS.INSPECT);
    dispatch({ type: "OPEN_PANEL", panel: "INSPECTOR" });
  };

  const selectTool = (tool) => {
    engine?.game?.commandBus?.execute("structural:cancel");
    engine?.game?.commandBus?.execute("construction:cancel");

    if (tool.mode === "structural") {
      engine?.setTool?.(TOOLS.INSPECT);
      engine?.game?.commandBus?.execute("structural:select", {
        type: tool.type,
        category
      });
      return;
    }

    if (tool.mode === "legacy") {
      engine?.setTool?.(TOOLS.INSPECT);
      engine?.game?.commandBus?.execute("construction:select", {
        type: tool.type,
        length: 20
      });
      return;
    }

    if (tool.type === "COMPACT") {
      engine?.setTool?.(TOOLS.COMPACT);
      return;
    }

    if (tool.type === "CHANNEL" || tool.type === "DIG") {
      engine?.setTool?.(TOOLS.DIG);
    }
  };

  return (
    <div className="construction-dock-wrap engineering-dock-wrap">
      <StructuralPreview preview={structuralPreview} />
      <BlueprintPanel preview={structuralPreview} />

      <ToolCategoryMenu
        category={category}
        selectedType={selectedType}
        onSelect={selectTool}
      />

      <nav className="construction-dock engineering-category-dock">
        <button
          className={!selectedType && state.activePanel === "INSPECTOR" ? "active" : ""}
          onClick={inspect}
          title="Inspecionar"
        >
          <b>⌖</b><span>Inspecionar</span>
        </button>

        {CATEGORIES.map(([id, label, icon]) => (
          <button
            key={id}
            className={category === id ? "active" : ""}
            onClick={() => setCategory(id)}
            title={label}
          >
            <b>{icon}</b>
            <span>{label}</span>
          </button>
        ))}

        <span className="dock-separator" />

        <button
          className={state.activePanel === "CITY" ? "active" : ""}
          onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "CITY" })}
        >
          <b>▦</b><span>Cidade</span>
        </button>

        <button
          className={state.activePanel === "EMERGENCY" ? "active danger" : "danger"}
          onClick={() => dispatch({ type: "TOGGLE_PANEL", panel: "EMERGENCY" })}
        >
          <b>!</b><span>Evacuação</span>
        </button>

        <button
          className={state.overlayToolbarOpen ? "active" : ""}
          onClick={() => dispatch({ type: "TOGGLE_OVERLAYS" })}
        >
          <b>◫</b><span>Overlays</span>
        </button>
      </nav>
    </div>
  );
}
