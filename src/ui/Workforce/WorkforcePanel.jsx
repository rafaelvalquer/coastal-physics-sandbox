import { ConstructionQueuePanel } from "./ConstructionQueuePanel.jsx";
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
        <span>Serviços essenciais</span><b>{workforce.essential}</b>
        <span>Reserva emergência</span><b>{workforce.emergencyReserve}</b>
        <span>Disponíveis</span><b>{workforce.available}</b>
      </div>
      <div className="material-stock">
        <small>ESTOQUE</small>
        {Object.entries(resources?.materials?.available || {}).map(([key, value]) => (
          <span key={key}>{key}<b>{Number(value).toFixed(1)}</b></span>
        ))}
      </div>
      <ConstructionQueuePanel engine={engine} snapshot={snapshot} />
    </section>
  );
}
