import { CONSTRUCTION_TYPES } from "../../data/constructions.js";

const LABELS = {
  CONCRETE_WALL: "Muro",
  RIPRAP: "Enrocamento",
  DUNE: "Duna",
  VEGETATION: "Vegetação",
  DRAINAGE: "Drenagem",
  BREAKWATER: "Quebra-mar"
};

export function BuildMenu({ engine, snapshot }) {
  const selected = snapshot?.selectedConstruction;

  function select(type) {
    if (!engine?.game) return;
    if (selected === type) engine.game.clearConstruction();
    else engine.game.selectConstruction(type, 20);
  }

  return (
    <div className="game-build-menu">
      <div className="game-panel-title">PROTEÇÃO COSTEIRA</div>
      <div className="game-build-grid">
        {Object.entries(CONSTRUCTION_TYPES).map(([type, config]) => (
          <button
            key={type}
            className={selected === type ? "game-build-button active" : "game-build-button"}
            onClick={() => select(type)}
            title={"Custo: $" + (config.costPerMeter * 20).toLocaleString("pt-BR")}
          >
            <strong>{LABELS[type] || type}</strong>
            <span>{"$" + config.costPerMeter.toLocaleString("pt-BR") + "/m"}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="game-build-hint">
          <span>Clique no mapa para construir 20 m. Clique novamente no item para cancelar.</span>
          {snapshot?.constructionPreview && (
            <b>
              {snapshot.constructionPreview.valid ? "Posição válida" : snapshot.constructionPreview.reason}
              {" · $" + Math.round(snapshot.constructionPreview.cost || 0).toLocaleString("pt-BR")}
              {snapshot.constructionPreview.soil?.material ? " · " + snapshot.constructionPreview.soil.material : ""}
              {snapshot.constructionPreview.risk ? " · risco " + snapshot.constructionPreview.risk.toLowerCase() : ""}
            </b>
          )}
        </div>
      )}
    </div>
  );
}
