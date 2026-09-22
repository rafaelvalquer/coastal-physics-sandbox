import { WorkerAssignment } from "./WorkerAssignment.jsx";
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "EMERGENCY"];
function remaining(job) {
  if (!Number.isFinite(job.remainingHours)) return "aguardando";
  if (job.remainingHours <= 0) return "concluído";
  return job.remainingHours < 1 ? Math.ceil(job.remainingHours * 60) + " min" : job.remainingHours.toFixed(1) + " h";
}
export function ConstructionQueuePanel({ engine, snapshot }) {
  const jobs = snapshot?.structuralEngineering?.jobs || [];
  const active = jobs.filter((job) => !["COMPLETED", "CANCELLED", "FAILED"].includes(job.state));
  return (
    <section className="construction-queue-panel">
      <div className="game-panel-title">OBRAS E REPAROS</div>
      {!active.length && <p className="empty-queue">Nenhuma obra ativa.</p>}
      {active.map((job) => (
        <article className="construction-job-card" key={job.id}>
          <div className="job-title">
            <strong>{job.blueprint?.type || job.type}</strong>
            <span>{job.state}</span>
          </div>
          <div className="job-progress"><span style={{ width: Math.round((job.progress || 0) * 100) + "%" }} /></div>
          <div className="job-meta">
            <span>{Math.round((job.progress || 0) * 100)}%</span>
            <span>{job.assignedWorkers || 0} trabalhando</span>
            <span>{remaining(job)}</span>
          </div>
          <WorkerAssignment engine={engine} job={job} />
          <div className="job-actions">
            <select
              value={job.priority || "NORMAL"}
              onChange={(event) => engine?.game?.commandBus?.execute("structural:set-priority", { jobId: job.id, priority: event.target.value })}
            >
              {PRIORITIES.map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
            <button onClick={() => engine?.game?.commandBus?.execute("structural:cancel-job", { jobId: job.id })}>Cancelar</button>
          </div>
        </article>
      ))}
    </section>
  );
}
