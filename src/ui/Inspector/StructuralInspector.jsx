import { FoundationInspector } from "./FoundationInspector.jsx";
function factor(value) { return Number.isFinite(value) ? value.toFixed(2) : "—"; }
function stateClass(value) { return value >= 1.5 ? "safe" : value >= 1.2 ? "warning" : value >= 1 ? "critical" : "failing"; }

export function StructuralInspector({ assembly, engine }) {
  if (!assembly) return null;
  const s = assembly.stability;
  const center = assembly.centerOfMass || { x: 0, y: 0 };
  const repair = () => engine?.game?.commandBus?.execute("structural:repair", { assemblyId: assembly.id, priority: "HIGH", workers: 4 });
  const reinforce = (type) => engine?.game?.commandBus?.execute("structural:reinforce", {
    assemblyId: assembly.id, type, x: center.x, y: assembly.bounds?.maxY || center.y, priority: "HIGH", workers: 4
  });
  return (
    <section className="structural-inspector">
      <div className="game-inspected-building">
        <strong>ESTRUTURA {assembly.id}</strong>
        <span>{assembly.blockCount} módulos</span>
      </div>
      <div className="game-data-list">
        <span>Massa</span><b>{(assembly.totalMass / 1000).toFixed(1)} t</b>
        <span>Centro de massa</span><b>{Math.round(center.x)}, {Math.round(center.y)}</b>
        <span>Altura</span><b>{assembly.height.toFixed(1)} m</b>
        <span>Base</span><b>{assembly.baseWidth.toFixed(1)} m</b>
        <span>Condição</span><b>{Math.round((assembly.condition || 0) * 100)}%</b>
        <span>Estado</span><b>{assembly.failed ? "FALHA " + assembly.failureMode : s?.state || "CALCULANDO"}</b>
      </div>
      {s && (
        <div className="stability-grid">
          {[
            ["Deslizamento", s.sliding?.factor],
            ["Tombamento", s.overturning?.factor],
            ["Uplift", s.uplift?.factor],
            ["Fundação", s.foundation?.factor]
          ].map(([label, value]) => (
            <div className={"stability-factor " + stateClass(value)} key={label}>
              <span>{label}</span><b>FS {factor(value)}</b>
            </div>
          ))}
        </div>
      )}
      <FoundationInspector foundations={assembly.foundations} />
      <div className="inspector-actions">
        <button onClick={repair}>Programar reparo</button>
        <button onClick={() => reinforce("SHALLOW_PILE")}>Adicionar estaca</button>
        <button onClick={() => reinforce("ROCK_ANCHOR")}>Adicionar âncora</button>
        <button onClick={() => reinforce("TIEBACK")}>Adicionar tirante</button>
      </div>
    </section>
  );
}
