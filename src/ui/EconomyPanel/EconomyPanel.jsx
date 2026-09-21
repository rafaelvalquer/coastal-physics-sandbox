export function EconomyPanel({ snapshot }) {
  return (
    <div className="game-card">
      <div className="game-panel-title">CIDADE</div>
      <div className="game-data-list">
        <span>Caixa</span><b>{"$" + Math.round(snapshot?.balance || 0).toLocaleString("pt-BR")}</b>
        <span>População</span><b>{snapshot?.population || 0}</b>
        <span>Desabrigados</span><b>{snapshot?.homeless || 0}</b>
        <span>Evacuados</span><b>{snapshot?.evacuated || 0}</b>
        <span>Resiliência</span><b>{snapshot?.resilience || 0}%</b>
      </div>
    </div>
  );
}
