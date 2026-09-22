function fsLabel(value) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(2);
}
export function StructuralPreview({ preview }) {
  if (!preview) return null;
  if (!preview.valid) {
    return <div className="structural-preview invalid"><strong>Posição inválida</strong><span>{preview.reason}</span></div>;
  }
  const s = preview.estimate?.stability;
  return (
    <div className="structural-preview">
      <div className="structural-preview-head">
        <strong>{preview.config?.label || "Projeto estrutural"}</strong>
        <span>{preview.soil?.material} · {Math.round((preview.soil?.moisture || 0) * 100)}% umidade</span>
      </div>
      <div className="structural-preview-grid">
        <span>Custo</span><b>{"$" + Math.round(preview.cost || 0).toLocaleString("pt-BR")}</b>
        <span>Trabalhadores</span><b>{preview.workersRequired}</b>
        <span>Tempo base</span><b>{Number(preview.laborHours || 0).toFixed(1)} h</b>
        {s && <>
          <span>Deslizamento</span><b>FS {fsLabel(s.sliding?.factor)}</b>
          <span>Tombamento</span><b>FS {fsLabel(s.overturning?.factor)}</b>
          <span>Uplift</span><b>FS {fsLabel(s.uplift?.factor)}</b>
          <span>Fundação</span><b>FS {fsLabel(s.foundation?.factor)}</b>
        </>}
      </div>
    </div>
  );
}
