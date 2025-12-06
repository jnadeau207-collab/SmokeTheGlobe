// src/app/regulator/page.tsx
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Regulator console · Smoke The Globe",
};

export const dynamic = "force-dynamic";

export default async function RegulatorHome() {
  const [licenseCount, batchCount, labResultCount, coaCount] = await Promise.all(
    [
      prisma.stateLicense.count().catch(() => 0),
      prisma.batch.count().catch(() => 0),
      prisma.labResult.count().catch(() => 0),
      prisma.coaDocument.count().catch(() => 0),
    ]
  );

  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-[0_0_80px_rgba(139,92,246,0.25)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-32 h-72 w-72 rounded-full bg-violet-500/24 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-[-7rem] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.22),transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.2),transparent_60%)] mix-blend-soft-light" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative z-10 space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-300/80">
              Regulator console
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Jurisdiction overview
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Oversight of licensed entities, batches, lab results, and
              Certificates of Analysis. All views are read-only until explicit
              regulator controls are enabled.
            </p>
          </div>
        </header>

        <main className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Licensed entities"
            value={licenseCount}
            helper="Records in StateLicense"
          />
          <StatCard
            label="Tracked batches"
            value={batchCount}
            helper="Records in Batch"
          />
          <StatCard
            label="Lab results"
            value={labResultCount}
            helper="Records in LabResult"
          />
          <StatCard
            label="COAs captured"
            value={coaCount}
            helper="Records in CoaDocument"
          />
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950 p-4 shadow-lg shadow-slate-900/50">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400/90">{helper}</p>
    </section>
  );
}
