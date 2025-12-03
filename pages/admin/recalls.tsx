import { useSession } from 'next-auth/react';

export default function AdminRecalls() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to manage recalls.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-1">Recalls</h1>
      <p className="text-sm text-slate-400 mb-4">
        This section will let you track batch-level recalls, their status, and
        links to underlying lab results and locations.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
        <p>
          <span className="font-semibold">Coming soon:</span> recall imports
          from state sites, linkage to batches, and public-facing recall
          summaries.
        </p>
      </div>
    </div>
  );
}
