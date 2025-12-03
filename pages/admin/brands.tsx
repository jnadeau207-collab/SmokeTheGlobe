import { useSession } from 'next-auth/react';

export default function AdminBrands() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to manage brands.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-1">Brands</h1>
      <p className="text-sm text-slate-400 mb-4">
        This section will manage brands / MSOs and link them to batches and
        locations for context in CartFax reports.
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
        <p>
          <span className="font-semibold">Coming soon:</span> brand CRUD,
          website/logo fields, and integration with batch and location metadata.
        </p>
      </div>
    </div>
  );
}
