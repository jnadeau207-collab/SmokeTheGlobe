// src/components/public/LandingClient.tsx
"use client";

import { useEffect, useState } from "react";

type LicenseResult = {
  id: string;
  licenseNumber: string;
  entityName: string;
  countryCode: string;
  regionCode: string | null;
  city: string | null;
};

type Props = {
  initialLicenseCount: number;
  initialBatchCount: number;
  initialCoaCount: number;
};

export default function LandingClient({
  initialLicenseCount,
  initialBatchCount,
  initialCoaCount,
}: Props) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [results, setResults] = useState<LicenseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    setError(null);
    setLoading(true);
    setHasSearched(true);

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (country.trim()) params.set("country", country.trim());
    if (region.trim()) params.set("region", region.trim());

    try {
      const res = await fetch(`/api/public/search?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Search failed");
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (e: any) {
      console.error(e);
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Optional: run initial empty search to show some licenses
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Background textures */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute right-[-6rem] bottom-[-8rem] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),transparent_60%)] mix-blend-soft-light" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="space-y-6 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            Global cannabis transparency index
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Explore licenses, labs, and COAs across the{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
                SmokeTheGlobe
              </span>
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              Search public license data and Certificates of Analysis across
              jurisdictions. Built for consumers, operators, and regulators who
              care about transparency from seed to sale.
            </p>
          </div>

          {/* Global stats */}
          <div className="grid gap-4 pt-2 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/60 via-slate-950 to-slate-950 p-4">
              <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">
                Licensed entities
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {initialLicenseCount}
              </p>
              <p className="mt-1 text-[11px] text-emerald-100/70">
                Tracks state / provincial licenses in multiple jurisdictions.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-900/60 via-slate-950 to-slate-950 p-4">
              <p className="text-[11px] uppercase tracking-wide text-sky-300/80">
                Batches
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {initialBatchCount}
              </p>
              <p className="mt-1 text-[11px] text-sky-100/70">
                Production lots and inventory flows captured in the platform.
              </p>
            </div>
            <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-900/60 via-slate-950 to-slate-950 p-4">
              <p className="text-[11px] uppercase tracking-wide text-fuchsia-300/80">
                COAs ingested
              </p>
              <p className="mt-1 text-2xl font-semibold">{initialCoaCount}</p>
              <p className="mt-1 text-[11px] text-fuchsia-100/70">
                Certificates of Analysis linked to batches and licenses.
              </p>
            </div>
          </div>
        </header>

        {/* Search + results / map layout */}
        <main className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Search panel */}
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Search licenses
              </h2>
              <button
                type="button"
                onClick={runSearch}
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20"
              >
                Refresh
              </button>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-[1.2fr_0.9fr_0.9fr]">
              <div className="space-y-1 sm:col-span-1">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Search
                </label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="License, operator, or city"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Country
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="e.g. US, CA"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Region / state
                </label>
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value.toUpperCase())}
                  placeholder="e.g. CA, ON"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center rounded-lg border border-emerald-400/60 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search licenses"}
            </button>

            {error && (
              <p className="mt-2 text-[11px] text-rose-300">{error}</p>
            )}

            <div className="mt-4 max-h-[24rem] space-y-2 overflow-y-auto pr-1">
              {results.length === 0 && hasSearched && !loading ? (
                <p className="text-[12px] text-slate-500">
                  No licenses found. Try adjusting your search or filters.
                </p>
              ) : (
                results.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950 p-4"
                  >
                    <h3 className="text-[13px] font-semibold text-slate-50">
                      {r.entityName}
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-400">
                      License:{" "}
                      <span className="text-slate-200">
                        {r.licenseNumber}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {r.city && <span>{r.city}, </span>}
                      {r.regionCode && <span>{r.regionCode}, </span>}
                      <span>{r.countryCode}</span>
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Map / drill-down placeholder */}
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-slate-50">
              Global coverage map
            </h2>
            <p className="text-[12px] text-slate-400">
              This panel is reserved for a 2D map visualization (e.g.
              react-simple-maps) showing coverage by country and region. With
              the jurisdiction fields in place, ETL jobs can now drive a true
              world → country → region → operator drill-down here.
            </p>
            <div className="mt-2 flex h-64 items-center justify-center rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 text-[11px] text-slate-500">
              Map visualization placeholder — wired to aggregated license
              counts per country/region in a future step.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
