export const TOOL_CATEGORIES = {
  TERRAIN: [
    { type: "DIG", label: "Escavar", icon: "⌄", mode: "terrain" },
    { type: "COMPACT", label: "Compactar", icon: "▦", mode: "terrain" }
  ],
  FOUNDATION: [
    { type: "FOUNDATION_BLOCK", label: "Sapata", icon: "▰", mode: "structural" },
    { type: "SHALLOW_PILE", label: "Estaca", icon: "│", mode: "structural" },
    { type: "DEEP_PILE", label: "Estaca profunda", icon: "║", mode: "structural" },
    { type: "ROCK_ANCHOR", label: "Âncora", icon: "↘", mode: "structural" },
    { type: "TIEBACK", label: "Tirante", icon: "→", mode: "structural" },
    { type: "GEOTEXTILE", label: "Geotêxtil", icon: "═", mode: "structural" }
  ],
  STRUCTURE: [
    { type: "CONCRETE_BLOCK", label: "Bloco concreto", icon: "▥", mode: "structural" },
    { type: "GABION", label: "Gabião", icon: "▧", mode: "structural" },
    { type: "PRECAST_WALL", label: "Parede pré-moldada", icon: "▯", mode: "structural" }
  ],
  PROTECTION: [
    { type: "ROCK_UNIT", label: "Enrocamento", icon: "◆", mode: "structural" },
    { type: "TETRAPOD", label: "Tetrápode", icon: "╳", mode: "structural" },
    { type: "BREAKWATER", label: "Quebra-mar", icon: "≋", mode: "legacy" },
    { type: "DUNE", label: "Duna", icon: "⌁", mode: "legacy" },
    { type: "VEGETATION", label: "Vegetação", icon: "⋀", mode: "legacy" }
  ],
  WATER: [
    { type: "DRAINAGE", label: "Drenagem", icon: "⇣", mode: "legacy" },
    { type: "CHANNEL", label: "Canal", icon: "⌄", mode: "terrain" },
    { type: "PORTABLE_PUMP", label: "Bomba portátil", icon: "↺", mode: "structural", priority: "HIGH" }
  ],
  EMERGENCY: [
    { type: "SANDBAG", label: "Saco de areia", icon: "▤", mode: "structural", priority: "EMERGENCY" },
    { type: "TEMP_BARRIER", label: "Barreira móvel", icon: "▯", mode: "structural", priority: "EMERGENCY" },
    { type: "PORTABLE_PUMP", label: "Bomba portátil", icon: "↺", mode: "structural", priority: "EMERGENCY" },
    { type: "ROCK_UNIT", label: "Enrocamento emerg.", icon: "◆", mode: "structural", priority: "EMERGENCY" }
  ]
};

export function ToolCategoryMenu({ category, selectedType, onSelect }) {
  const tools = TOOL_CATEGORIES[category] || [];
  return (
    <div className="tool-category-menu">
      {tools.map((tool) => (
        <button
          key={category + ":" + tool.type}
          className={selectedType === tool.type ? "active" : ""}
          onClick={() => onSelect(tool)}
          title={tool.label}
        >
          <b>{tool.icon}</b>
          <span>{tool.label}</span>
        </button>
      ))}
    </div>
  );
}
