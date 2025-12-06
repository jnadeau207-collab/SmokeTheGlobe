export default function AdminRecallsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Recalls</h1>
      <p className="text-sm text-slate-400">
        Manage product recall notices and link them to affected batches, brands, or locations.
      </p>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
        <p>
          <span className="font-semibold">Coming soon:</span> functionality to issue new recalls, notify relevant parties, and display recall info on consumer-facing pages.
        </p>
      </div>
    </div>
  );
}
