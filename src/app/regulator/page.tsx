export default function RegulatorHomePage() {
  return (
    <div className="space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Jurisdiction Overview</h1>
      <p className="text-sm text-slate-400">
        Welcome to the regulator console. Monitor all licensed operators in your jurisdiction and review compliance data at a glance.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-100">Licenses</h2>
          <p className="text-xs text-slate-400">Overview of active licenses, pending applications, and suspensions.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-100">Activity & Reports</h2>
          <p className="text-xs text-slate-400">Monitor seed-to-sale reports, transfer logs, and flagged anomalies in real time.</p>
        </div>
      </div>
    </div>
  );
}
