// src/app/operator/licenses/[licenseId]/inventory/page.tsx

export const metadata = {
  title: "Inventory & COGS · License suite · Smoke The Globe",
};

export default function LicenseInventoryPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-50">
          Inventory & cost of goods
        </h2>
        <p className="mt-1 text-[12px] text-slate-400">
          A full inventory and cost-of-goods hub for this license: nutrients,
          media, packaging, retail fixtures, office supplies, and any other
          inputs that touch your cannabis or non-cannabis operations.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Stock categories
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Nutrients, additives, and growing media.</li>
            <li>Packaging (jars, bags, labels, boxes).</li>
            <li>Facilities & maintenance (filters, bulbs, HVAC parts).</li>
            <li>Administrative & office (paper towels, POS rolls, etc.).</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            COGS tracking
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Cost-per-gram rollups by batch and package.</li>
            <li>
              Allocation of shared costs (rent, power) across rooms and
              licenses.
            </li>
            <li>Historical COGS timelines for forecasting and pricing.</li>
            <li>
              Drill-down from invoice → inventory → batch → sale, once sales
              modules are added.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Next implementation steps
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>
              Define inventory item model and transactions (receipts, usage,
              adjustments).
            </li>
            <li>
              UI for intake of vendor invoices and stock receipts, decoupled
              from the ETL pipeline.
            </li>
            <li>
              Link inventory consumption to batches and rooms to compute per‑unit
              costs.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
