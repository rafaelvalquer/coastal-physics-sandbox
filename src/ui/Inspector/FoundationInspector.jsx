export function FoundationInspector({ foundations = [] }) {
  if (!foundations.length) return <p className="foundation-empty">Sem fundação especializada.</p>;
  return (
    <div className="foundation-inspector">
      <small>FUNDAÇÃO / ANCORAGEM</small>
      {foundations.map((item) => (
        <div className="foundation-row" key={item.id}>
          <span>{item.type}</span>
          <b>{Math.round((item.integrity ?? 1) * 100)}%</b>
          <em>{item.embeddedMaterial || "—"}</em>
        </div>
      ))}
    </div>
  );
}
