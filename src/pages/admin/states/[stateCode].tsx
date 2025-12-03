import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

type Brand = {
  id: number;
  name: string;
};

type LabResult = {
  id: number;
  thcPercent: number | null;
  totalCannabinoidsPercent: number | null;
  passed: boolean | null;
};

type Batch = {
  id: number;
  batchCode: string;
  productName?: string | null;
  productCategory?: string | null;
  productSubcategory?: string | null;
  stateCode?: string | null;
  isActive: boolean;
  createdAt: string;
  brand?: Brand | null;
  labResults?: LabResult[];
};

export default function AdminStateDetail() {
  const router = useRouter();
  const { data: session } = useSession();
  const { stateCode } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!session) return;
    if (!stateCode || typeof stateCode !== 'string') return;
    fetchBatches(stateCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, stateCode]);

  async function fetchBatches(code: string) {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('stateCode', code);
      const res = await fetch(`/api/admin/batches?${params.toString()}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to load batches');
      }
      const data: Batch[] = await res.json();
      setBatches(data);
    } catch (e: any) {
      console.error('Failed to fetch batches for state', e);
      setError(e.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  }

  const brands = useMemo(() => {
    const map = new Map<number, Brand>();
    for (const b of batches) {
      if (b.brand) {
        map.set(b.brand.id, b.brand);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [batches]);

  const filteredBatches = useMemo(() => {
    let list = batches;

    if (activeBrandId !== 'all') {
      list = list.filter((b) => b.brand && b.brand.id === activeBrandId);
    }

    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.batchCode.toLowerCase().includes(q) ||
          (b.productName || '').toLowerCase().includes(q) ||
          (b.productCategory || '').toLowerCase().includes(q),
      );
    }

    return list;
  }, [batches, activeBrandId, search]);

  const totalBatches = batches.length;
  const totalBrands = brands.length;
  const totalLabResults = batches.reduce(
    (acc, b) => acc + (b.labResults?.length || 0),
    0,
  );

  const code = typeof stateCode === 'string' ? stateCode.toUpperCase() : '??';

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to view state details.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            onClick={() => router.push('/admin/states')}
            className="text-xs text-sky-400 hover:text-sky-300 mb-1"
          >
            ← Back to state map
          </button>
          <h1 className="text-2xl font-semibold mb-1">
            {code} · batches & lab results
          </h1>
          <p className="text-sm text-slate-400">
            Exploring all batches currently assigned to <span>{code}</span>. Use
            brand filters and search to stay sane with large datasets.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-slate-400 text-xs mb-1">
            Total batches in {code}
          </div>
          <div className="text-xl font-semibold text-slate-100">
            {totalBatches}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-slate-400 text-xs mb-1">Unique brands</div>
          <div className="text-xl font-semibold text-slate-100">
            {totalBrands}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-slate-400 text-xs mb-1">Lab results linked</div>
          <div className="text-xl font-semibold text-slate-100">
            {totalLabResults}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 text-xs">
        {error && (
          <div className="text-red-400 bg-red-950/40 border border-red-700/60 rounded-md px-3 py-2 text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="block mb-1 text-slate-300 text-xs">
              Search batches in {code}
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Batch code, product name, category…"
              className="w-full p-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Brand filter chips */}
        <div className="space-y-1">
          <div className="text-slate-400 text-[11px]">
            Filter by brand ({totalBrands})
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveBrandId('all')}
              className={`px-2 py-1 rounded-full border text-[11px] ${
                activeBrandId === 'all'
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'border-slate-700 text-slate-200 hover:border-sky-500'
              }`}
            >
              All brands
            </button>
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBrandId(b.id)}
                className={`px-2 py-1 rounded-full border text-[11px] ${
                  activeBrandId === b.id
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'border-slate-700 text-slate-200 hover:border-sky-500'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batches list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="text-slate-100 font-semibold">
              {filteredBatches.length}
            </span>{' '}
            of <span className="font-semibold">{totalBatches}</span> batches in{' '}
            {code}
          </div>
          <button
            onClick={() =>
              stateCode && typeof stateCode === 'string'
                ? fetchBatches(stateCode)
                : null
            }
            className="px-2 py-1 rounded-md border border-slate-700 text-xs text-slate-200"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="text-xs text-slate-400">Loading batches…</div>
        )}

        {!loading && filteredBatches.length === 0 && (
          <div className="text-xs text-slate-500">
            No batches match this filter in {code} yet.
          </div>
        )}

        {!loading && filteredBatches.length > 0 && (
          <div className="space-y-2">
            {filteredBatches.map((b) => {
              const latestLab =
                b.labResults && b.labResults.length > 0
                  ? b.labResults[0]
                  : null;

              return (
                <div
                  key={b.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {b.batchCode}
                      </span>
                      {b.isActive && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[10px] text-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    {b.productName && (
                      <div className="text-slate-200">{b.productName}</div>
                    )}
                    <div className="text-slate-400">
                      {b.productCategory || 'Uncategorized'}
                      {b.productSubcategory ? ` · ${b.productSubcategory}` : ''}
                      {b.brand ? ` · ${b.brand.name}` : ''}
                    </div>
                    <div className="text-slate-500">
                      Created {new Date(b.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {latestLab && (
                      <>
                        <div className="px-2 py-1 rounded-md border border-slate-700 text-slate-200">
                          THC:{' '}
                          {latestLab.thcPercent != null
                            ? `${latestLab.thcPercent.toFixed(1)}%`
                            : '—'}
                        </div>
                        <div className="px-2 py-1 rounded-md border border-slate-700 text-slate-200">
                          Total cannabinoids:{' '}
                          {latestLab.totalCannabinoidsPercent != null
                            ? `${latestLab.totalCannabinoidsPercent.toFixed(
                                1,
                              )}%`
                            : '—'}
                        </div>
                        {latestLab.passed != null && (
                          <div
                            className={`px-2 py-1 rounded-md border ${
                              latestLab.passed
                                ? 'border-emerald-500/60 text-emerald-300'
                                : 'border-red-500/60 text-red-400'
                            }`}
                          >
                            {latestLab.passed ? 'Pass' : 'Fail'}
                          </div>
                        )}
                      </>
                    )}
                    {!latestLab && (
                      <div className="px-2 py-1 rounded-md border border-slate-700 text-slate-400">
                        No lab result linked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
