import { useState } from "react";
import { ScenarioLoader } from "../../scenarios/ScenarioLoader.js";

export function CampaignPanel({ engine, snapshot }) {
  const [scenarioId, setScenarioId] = useState(snapshot?.scenarioId || "porto-esperanca");
  const [difficulty, setDifficulty] = useState(snapshot?.difficulty || "NORMAL");
  const scenarios = ScenarioLoader.list();

  const unlocked = new Set(snapshot?.campaign?.unlocked || ["porto-esperanca"]);
  const technologies = snapshot?.technology || [];

  function loadScenario() {
    if (!unlocked.has(scenarioId) && scenarioId !== snapshot?.scenarioId) return;
    engine?.loadScenario?.(scenarioId, difficulty);
  }

  return (
    <div className="game-card">
      <div className="game-panel-title">CAMPANHA E PESQUISA</div>
      <div className="campaign-select-row">
        <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>
          {scenarios.map((scenario) => (
            <option
              key={scenario.id}
              value={scenario.id}
              disabled={!unlocked.has(scenario.id) && scenario.id !== snapshot?.scenarioId}
            >
              {scenario.name}
            </option>
          ))}
        </select>
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="EASY">Fácil</option>
          <option value="NORMAL">Normal</option>
          <option value="HARD">Difícil</option>
        </select>
        <button onClick={loadScenario}>Iniciar</button>
      </div>

      <div className="research-points">
        <span>Research Points</span>
        <b>{snapshot?.researchPoints || 0}</b>
      </div>

      <div className="technology-list">
        {technologies.slice(0, 8).map((technology) => (
          <span key={technology}>{technology}</span>
        ))}
      </div>

      {!!snapshot?.achievements?.length && (
        <div className="achievement-list">
          {snapshot.achievements.slice(-4).map((achievement) => (
            <span key={achievement}>★ {achievement}</span>
          ))}
        </div>
      )}
    </div>
  );
}
