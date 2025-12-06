// src/app/operator/analytics/page.tsx

export const metadata = {
  title: "Operator analytics · Smoke The Globe",
};

export default function OperatorAnalyticsPage() {
  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-cyan-500/24 blur-3xl" />
        <div className="absolute right-[-4rem] bottom-[-6rem] h-64 w-64 rounded-full bg-emerald-500/18 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative z-10 space-y-6">
        <header>
          <h1 className="text-lg font-semibold">Analytics (coming online)</h1>
          <p className="mt-1 text-[12px] text-slate-400">
            This module will visualize throughput, potency distributions, COA
            pass/fail rates, and recall exposure once the ETL pipeline is
            feeding consistent data. For now, it serves as a design stub for
            the control surface.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Batch volume over time
            </p>
            <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-[11px] text-slate-500">
              Chart placeholder (daily lots)
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Potency distribution
            </p>
            <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-[11px] text-slate-500">
              Chart placeholder (THC/CBD histogram)
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              COA pass / fail
            </p>
            <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-[11px] text-slate-500">
              Chart placeholder (compliance rate)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
