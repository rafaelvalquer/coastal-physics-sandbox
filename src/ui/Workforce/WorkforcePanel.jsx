import { ConstructionQueuePanel } from "./ConstructionQueuePanel.jsx";
import { MATERIAL_UNITS, MATERIAL_PRICES } from "../../gameplay/resources/MaterialStockpile.js";
export function WorkforcePanel({ engine, snapshot }) {
  const workforce = snapshot?.structuralEngineering?.workforce;
  const resources = snapshot?.structuralEngineering?.resources;
  if (!workforce) return null;
  return (
    <section className="workforce-panel">
      <div className="game-panel-title">FORÇA DE TRABALHO</div>
      <div className="workforce-grid">
        <span>População apta</span><b>{workforce.workingPopulation}</b>
        <span>Equipe municipal</span><b>{workforce.total}</b>
        <span>Construção</span><b>{workforce.construction}</b>
        <span>Manutenção</span><b>{workforce.maintenance || 0}</b>
        <span>Emergência em campo</span><b>{workforce.emergency || 0}</b>
        <span>Serviços essenciais</span><b>{workforce.essential}</b>
        <span>Reserva emergência</span><b>{workforce.emergencyReserve}</b>
        <span>Disponíveis</span><b>{workforce.available}</b>
      </div>
      <div className="material-stock">
        <small>ESTOQUE</small>
        {Object.entries(resources?.materials?.available || {}).map(([key, value]) => (
          <span key={key} className="material-stock-row">
            <span>{key}<small>{MATERIAL_UNITS[key] || ""}</small></span>
            <b>{Number(value).toFixed(1)}</b>
            <button
              title={"Comprar 1 " + (MATERIAL_UNITS[key] || "") + " · $" + (MATERIAL_PRICES[key] || 0)}
              onClick={() => engine?.game?.commandBus?.execute("resources:purchase", { material: key, quantity: 1 })}
            >+$</button>
          </span>
        ))}
      </div>
      <ConstructionQueuePanel engine={engine} snapshot={snapshot} />
    </section>
  );
}
