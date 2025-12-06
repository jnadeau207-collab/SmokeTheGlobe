// src/app/operator/licenses/[licenseId]/plants/page.tsx

export const metadata = {
  title: "Plants · License suite · Smoke The Globe",
};

export default function LicensePlantsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-50">Plants</h2>
        <p className="mt-1 text-[12px] text-slate-400">
          Track individual plants or plant groups from clone through harvest.
          Later this will connect to seed lots, batches, and metrics like yield
          per square foot.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Planned capabilities
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Plant creation and lifecycle transitions (clone → veg → flower).</li>
          <li>
            Association with rooms and genetics (seed lots or mother plants).
          </li>
          <li>Harvest linkage to production batches and COAs.</li>
          <li>Exception handling: destroyed plants, contamination events.</li>
        </ul>
      </section>
    </div>
  );
}
