export function WorkerAssignment({ engine, job }) {
  const setWorkers = (delta) => {
    engine?.game?.commandBus?.execute("structural:set-workers", {
      jobId: job.id,
      workers: Math.max(1, (job.desiredWorkers || 1) + delta)
    });
  };
  return (
    <div className="worker-assignment">
      <button onClick={() => setWorkers(-1)}>−</button>
      <span>{job.desiredWorkers || 1} trab.</span>
      <button onClick={() => setWorkers(1)}>+</button>
    </div>
  );
}
