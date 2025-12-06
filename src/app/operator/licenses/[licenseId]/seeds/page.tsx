// src/app/operator/licenses/[licenseId]/seeds/page.tsx

export const metadata = {
  title: "Seeds & genetics · License suite · Smoke The Globe",
};

export default function LicenseSeedsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-50">
          Seeds & genetics
        </h2>
        <p className="mt-1 text-[12px] text-slate-400">
          Manage seed lots, genetics vendors, strain metadata, and upstream
          provenance. This module will connect genetics to downstream plant and
          batch performance.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Planned capabilities
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Seed lot records with vendor, cost, and acquisition dates.</li>
          <li>Strain metadata (lineage, terpene profiles, potency ranges).</li>
          <li>
            Link seed lots to plantings to analyze performance by genetics.
          </li>
          <li>Integration with inventory & COGS for seed purchases.</li>
        </ul>
      </section>
    </div>
  );
}
