const TASK_LABELS = {
  OBSERVE_SEA: "Observe três ondas chegando do oceano",
  INSPECT_COAST: "Inspecione a costa",
  BUILD_40M_PROTECTION: "Construa 40 m de proteção costeira",
  BUILD_20M_PROTECTION: "Construa 20 m de proteção",
  OPEN_FORECAST: "Observe a previsão",
  PREPARE_STORM: "Prepare-se para a ressaca",
  REVIEW_DAMAGE: "Analise os danos",
  REPAIR: "Faça reparos"
};

export function ObjectivePanel({ snapshot }) {
  return (
    <div className="game-card">
      <div className="game-panel-title">OBJETIVOS</div>
      <div className="game-objective">
        <strong>Porto Esperança</strong>
        <span>Sobreviva 10 anos mantendo ≥ 80% da população e infraestrutura crítica.</span>
      </div>
      <div className="game-tutorial">
        <small>Tarefa atual</small>
        <b>{TASK_LABELS[snapshot?.tutorial?.current] || "Tutorial concluído"}</b>
      </div>
      {!!snapshot?.objectives?.completed?.length && (
        <div className="game-completed">
          {snapshot.objectives.completed.map((id) => <span key={id}>✓ {id}</span>)}
        </div>
      )}
    </div>
  );
}
