// src/app/operator/licenses/[licenseId]/batches/page.tsx

export const metadata = {
  title: "Batches · License suite · Smoke The Globe",
};

export default function LicenseBatchesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-50">Batches</h2>
        <p className="mt-1 text-[12px] text-slate-400">
          Harvest and production batches for this license. Ultimately, each
          batch will connect back to plants, rooms, packages, and COAs.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Planned capabilities
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Create and manage harvest batches and process lots.</li>
          <li>
            Record transformations (e.g. biomass → crude → distillate →
            finished goods).
          </li>
          <li>Associate each batch with COAs and lab outcomes.</li>
          <li>
            Expose batch lineage for regulators and internal audit teams.
          </li>
        </ul>
      </section>
    </div>
  );
}
