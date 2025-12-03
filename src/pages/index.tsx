import SearchAlgolia from '../components/SearchAlgolia';
import MapWithSearch from '../components/MapWithSearch';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[3fr,2fr] items-start">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            BETA Â· Honest data on legal cannabis
          </span> 

          <h1 className="text-emerald-900 md:text-5xl font-semibold tracking-tight">
            The <span className="text-emerald-400">Carfax for cannabis</span>
            <br />
            retailers & batches.
          </h1>

          <p className="text-emerald-900 text-sm md:text-base max-w-xl">
            CartFax aggregates third-party lab results, batch metadata, and
            retailer info so you can verify what&apos;s in your cart before you
            check out.
          </p>

          <ul className="text-xs md:text-sm text-slate-950 space-y-1">
            <li>â€¢ Dispensary directory (legal U.S. markets only)</li>
            <li>â€¢ Batch-level potency & contaminant summaries</li>
            <li>â€¢ Independent lab PDFs attached â€” not just marketing claims</li>
          </ul>

          <div className="rounded-xl border border-emerald-200 bg bg-emerald-400 backdrop-blur-sm p-3 shadow-sm shadow-emerald-300">
            <h2 className="text-sm font-semibold mb-2 text-slate-900">
              Search retailers & batches
            </h2>
            <SearchAlgolia />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg bg-emerald-400 backdrop-blur-sm p-3 shadow-sm shadow-emerald-300">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Map view (prototype)
          </h2>
          <MapWithSearch />
          <p className="mt-2 text-[11px] text-emerald-500">
            Geolocation + Algolia aroundLatLng coming online as data is added.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
        <div className="rounded-lg border border-emerald-300 bg-emerald-900/90 p-4 shadow-2xl shadow-white/10">
          <div className="text-emerald-300 font-semibold mb-1 text-xs">
            FOR PATIENTS & ADULT-USE
          </div>
          <div className="font-medium mb-1 underline decoration-solid">Trust, not hype.</div>
          <p className="text-white">
            See where a retailer sources its products, how often batches are
            tested, and whether lab results are independent and recent.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-300 bg-emerald-900/90 p-4 shadow-2xl shadow-white/10">
          <div className="text-emerald-300 font-semibold mb-1 text-xs">
            FOR OPERATORS
          </div>
          <div className="font-medium mb-1 underline decoration-solid">Verified batch history.</div>
          <p className="text-white ">
            Attach lab PDFs, batch IDs, and product lines so customers and
            regulators see a clean, verifiable trail.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-300 bg-emerald-900/90 p-4 shadow-2xl shadow-white/10">
          <div className="text-emerald-300 font-semibold mb-1 text-xs">
            FOR ANALYSTS
          </div>
          <div className="font-medium mb-1 underline decoration-solid">A better data layer.</div>
          <p className="text-white">
            Normalize batch and retailer metadata across markets to compare
            categories, brands, and lab results over time.
          </p>
        </div>
      </section>
    </div>
  );
}

