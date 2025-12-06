// src/app/operator/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Operator control room · Smoke The Globe",
};

export const dynamic = "force-dynamic";

export default async function OperatorHome() {
  const [licenseCount, batchCount, coaCount] = await Promise.all([
    prisma.stateLicense.count().catch(() => 0),
    prisma.batch.count().catch(() => 0),
    prisma.coaDocument.count().catch(() => 0),
  ]);

  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-[0_0_80px_rgba(16,185,129,0.25)]">
      {/* Background textures */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-32 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-[-7rem] h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),transparent_60%)] mix-blend-soft-light" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative z-10 space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-300/80">
              Operator suite
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Facility command center
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              High-level telemetry across your licenses, batches, and
              Certificates of Analysis. Use the tiles below as launchpads into
              your full seed-to-sale suite.
            </p>
          </div>
          <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            Seed-to-sale overview
          </div>
        </header>

        <main className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Licenses"
            value={licenseCount}
            helper="Open license suites"
            accent="emerald"
            href="/operator/licenses"
          />
          <StatCard
            label="Batches"
            value={batchCount}
            helper="View production lots"
            accent="sky"
            href="/operator/batches"
          />
          <StatCard
            label="COAs"
            value={coaCount}
            helper="Review Certificates of Analysis"
            accent="fuchsia"
            href="/operator/coas"
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
  accent,
  href,
}: {
  label: string;
  value: number;
  helper: string;
  accent: "emerald" | "sky" | "fuchsia";
  href: string;
}) {
  const accentClasses: Record<typeof accent, string> = {
    emerald:
      "border-emerald-500/40 from-emerald-900/60 via-slate-950 to-slate-950 shadow-emerald-900/45",
    sky:
      "border-sky-500/40 from-sky-900/60 via-slate-950 to-slate-950 shadow-sky-900/45",
    fuchsia:
      "border-fuchsia-500/40 from-fuchsia-900/60 via-slate-950 to-slate-950 shadow-fuchsia-900/45",
  };

  return (
    <Link href={href} className="block">
      <section
        className={[
          "h-full rounded-2xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/70 hover:shadow-[0_0_35px_rgba(16,185,129,0.35)]",
          accentClasses[accent],
        ].join(" ")}
      >
        <p className="text-[11px] uppercase tracking-wide text-slate-300/80">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-[11px] text-slate-300/80">{helper}</p>
        <p className="mt-3 text-[11px] text-emerald-200/80">
          Click to drill into {label.toLowerCase()} →
        </p>
      </section>
    </Link>
  );
}
