export default function AnalyticsHomePage() {
  return (
    <div className="space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Analytics & AI Lab</h1>
      <p className="text-sm text-slate-400">
        Welcome to the analytics lab. Explore aggregated data, run transparency analyses, and experiment with AI models.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-100">Datasets</h2>
          <p className="text-xs text-slate-400">Browse and export curated datasets of licenses, lab results, and more.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-100">Models</h2>
          <p className="text-xs text-slate-400">Run anomaly detection and transparency scoring models on the latest data.</p>
        </div>
      </div>
    </div>
  );
}
