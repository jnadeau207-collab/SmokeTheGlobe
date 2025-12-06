// src/app/operator/licenses/[licenseId]/packages/page.tsx

export const metadata = {
  title: "Packages · License suite · Smoke The Globe",
};

export default function LicensePackagesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-50">Packages</h2>
        <p className="mt-1 text-[12px] text-slate-400">
          Packages represent sellable units and transfer containers: jars,
          pouches, cases, pallets. Later this will tie into sales channels,
          transfers, and compliance reporting.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Planned capabilities
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            Package creation from batches or bulk inventory (e.g. case
            breakdowns).
          </li>
          <li>
            Status tracking: in vault, on sales floor, transferred, destroyed,
            returned.
          </li>
          <li>Label printing hooks and packaging cost attribution.</li>
          <li>
            Mapping to external systems (METRC tags, internal barcodes, etc.).
          </li>
        </ul>
      </section>
    </div>
  );
}
