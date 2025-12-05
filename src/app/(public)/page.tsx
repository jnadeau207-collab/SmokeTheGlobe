// src/app/(public)/page.tsx
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
        Smoke The Globe
      </p>
      <h1 className="mb-4 text-3xl font-semibold sm:text-4xl">
        Global cannabis transparency, from seed to sale.
      </h1>
      <p className="max-w-2xl text-sm text-slate-400">
        Smoke The Globe ingests licensing data, lab reports, and supply‑chain records so patients,
        regulators, and operators share the same source of truth.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
          Live license registry
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
          COA ingestion & validation
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
          Seed‑to‑sale oversight
        </span>
      </div>
    </main>
  );
}
