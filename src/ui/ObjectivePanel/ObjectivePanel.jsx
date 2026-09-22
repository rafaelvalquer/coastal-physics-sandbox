const TASK_LABELS = {
  OBSERVE_SEA: "Observe três ondas chegando do oceano",
  INSPECT_SOIL: "Inspecione o solo da futura fundação",
  EXCAVATE_FOUNDATION: "Escave a área da fundação",
  BUILD_FOOTING: "Construa uma sapata modular",
  PLACE_TWO_PILES: "Instale duas estacas",
  BUILD_WALL_3M: "Construa um muro modular com pelo menos 3 m",
  VIEW_CENTER_OF_MASS: "Ative F11 e observe o centro de massa",
  CHECK_STABILITY: "Inspecione os fatores de estabilidade",
  INSTALL_ANCHOR: "Instale uma âncora",
  COMPARE_STABILITY: "Compare novamente os fatores de estabilidade",
  ASSIGN_WORKERS: "Ajuste os trabalhadores de uma obra",
  WAIT_CONSTRUCTION: "Aguarde a conclusão de uma obra",
  WATCH_STORM: "Observe o pico da ressaca",
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
