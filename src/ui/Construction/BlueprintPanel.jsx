import { MATERIAL_UNITS } from "../../gameplay/resources/MaterialStockpile.js";
export function BlueprintPanel({ preview }) {
  if (!preview?.valid) return null;
  return (
    <div className="blueprint-panel">
      <small>MATERIAIS</small>
      {Object.entries(preview.materials || {}).map(([material, quantity]) => (
        <span key={material}>{material}: <b>{quantity} {MATERIAL_UNITS[material] || ""}</b></span>
      ))}
      {!Object.keys(preview.materials || {}).length && <span>Sem materiais adicionais</span>}
    </div>
  );
}
