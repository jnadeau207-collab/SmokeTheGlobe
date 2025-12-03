import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function AdminIndex() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-xl font-semibold mb-2">CartFax Admin</h1>
        <p className="text-sm text-slate-400 mb-4">
          Sign in with your admin credentials to manage batches, lab results,
          and verification data.
        </p>
        <button
          onClick={() => signIn()}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CartFax Admin Dashboard</h1>
          <p className="text-sm text-slate-400">
            Batch-first verification, lab results, and regulatory data.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
        >
          Sign out
        </button>
      </div>

      <Link
        href="/admin/states"
        className="block rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-sky-500"
      >
        <h2 className="text-sm font-semibold text-slate-100 mb-1">
          Browse by state
        </h2>
        <p className="text-xs text-slate-400">
          Explore operators, labs, and batches organized by state instead of
          giant national lists.
        </p>
      </Link>

      {/* Primary sections */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/batches"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            CORE
          </div>
          <div className="font-medium mb-1">Batches</div>
          <p className="text-xs text-slate-400">
            Create and manage batch records, link them to brands, locations, lab
            results, and recall data.
          </p>
        </Link>

        <Link
          href="/admin/lab-results"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            LAB DATA
          </div>
          <div className="font-medium mb-1">Lab results</div>
          <p className="text-xs text-slate-400">
            View and normalize lab results (COAs) linked to batches and labs.
          </p>
        </Link>

        <Link
          href="/admin/uploads"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            INPUTS
          </div>
          <div className="font-medium mb-1">COA uploads</div>
          <p className="text-xs text-slate-400">
            Upload and manage raw PDF lab reports (COAs) that will be parsed
            into structured lab results.
          </p>
        </Link>
      </div>

      {/* Secondary sections */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/brands"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            CONTEXT
          </div>
          <div className="font-medium mb-1">Brands</div>
          <p className="text-xs text-slate-400">
            Manage brands / MSOs and link them to batches and locations.
          </p>
        </Link>

        <Link
          href="/admin/locations"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            CONTEXT
          </div>
          <div className="font-medium mb-1">Locations</div>
          <p className="text-xs text-slate-400">
            Manage dispensaries, cultivation sites, and manufacturing locations.
          </p>
        </Link>

        <Link
          href="/admin/labs"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            LABS
          </div>
          <div className="font-medium mb-1">Labs</div>
          <p className="text-xs text-slate-400">
            Manage testing labs, link them to state licenses, and score
            reliability.
          </p>
        </Link>
      </div>

      {/* Regulatory / Safety sections */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/licenses"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            REGULATORY
          </div>
          <div className="font-medium mb-1">State licenses</div>
          <p className="text-xs text-slate-400">
            Import and manage state license records to link brands, locations,
            and labs to regulatory data.
          </p>
        </Link>

        <Link
          href="/admin/recalls"
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            SAFETY
          </div>
          <div className="font-medium mb-1">Recalls</div>
          <p className="text-xs text-slate-400">
            Track batch-level recalls and enforcement actions across
            jurisdictions.
          </p>
        </Link>

        <Link
          href="/admin/batches" // for now, reuse batches page for ratings management
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500 transition-colors"
        >
          <div className="text-xs font-semibold text-emerald-400 mb-1">
            SIGNALS
          </div>
          <div className="font-medium mb-1">Batch ratings</div>
          <p className="text-xs text-slate-400">
            Manage aggregated 5-star scores for batches from internal and
            external sources.
          </p>
        </Link>
      </div>
    </div>
  );
}
