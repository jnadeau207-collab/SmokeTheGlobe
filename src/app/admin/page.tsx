// src/app/admin/page.tsx
export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-xl shadow-emerald-500/15 backdrop-blur-xl">
        <h1 className="text-lg font-semibold text-slate-50">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Welcome to the internal cannabis data admin. Use the sidebar to
          navigate between license transparency, COA uploads, and galaxy
          exploration.
        </p>
      </div>
    </div>
  );
}
