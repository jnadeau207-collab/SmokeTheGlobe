// pages/admin/states/[stateCode].tsx
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type LabResultSummary = {
  id: number;
  passed: boolean | null;
  thcPercent: number | null;
  totalCannabinoidsPercent: number | null;
};

type Lab = {
  id: number;
  name: string;
  slug: string;
  website?: string | null;
  city?: string | null;
  stateCode?: string | null;
  accreditation?: string | null;
  reliabilityScore?: number | null;
  stateLicense?: {
    licenseNumber: string;
    licenseType: string;
    status: string;
  } | null;
  labResults: LabResultSummary[];
};

type BatchLocation = {
  id: number;
  location: {
    id: number;
    name: string;
    city?: string | null;
    state?: string | null;
    type: string;
  };
};

type ReviewAggregate = {
  ratingAvg: number;
  ratingCount: number;
};

type Batch = {
  id: number;
  batchCode: string;
  productName?: string | null;
  jurisdiction?: string | null;
  stateCode?: string | null;
  brand?: {
    id: number;
    name: string;
  } | null;
  reviewAggregate?: ReviewAggregate | null;
  labResults: LabResultSummary[];
  locations: BatchLocation[];
};

type Location = {
  id: number;
  name: string;
  slug: string;
  type: string;
  city?: string | null;
  state?: string | null;
  brand?: {
    id: number;
    name: string;
  } | null;
  stateLicense?: {
    licenseNumber: string;
    licenseType: string;
    status: string;
  } | null;
  batchLinks: {
    id: number;
    batch: {
      id: number;
      batchCode: string;
    } | null;
  }[];
};

type StateDetailPayload = {
  stateCode: string;
  labs: Lab[];
  batches: Batch[];
  locations: Location[];
};

export default function AdminStateDetail() {
  const router = useRouter();
  const { stateCode } = router.query;
  const { data: session, status } = useSession();

  const [data, setData] = useState<StateDetailPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'labs' | 'batches' | 'locations'>('labs');

  useEffect(() => {
    // Wait until we actually know the auth state AND we have a state code
    if (status !== 'authenticated') return;
    if (!stateCode) return;

    const codeStr = Array.isArray(stateCode) ? stateCode[0] : stateCode;
    fetchStateDetail(codeStr);
  }, [stateCode, status]);

  async function fetchStateDetail(codeStr: string) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/states/${codeStr}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to load state detail');
      }

      const payload: StateDetailPayload = await res.json();
      setData(payload);
    } catch (e: any) {
      console.error('Failed to fetch state detail', e);
      setError(e.message || 'Failed to load state detail');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to view state drill-down.
        </p>
      </div>
    );
  }

  const stateCodeParam =
    typeof stateCode === 'string'
      ? stateCode.toUpperCase()
      : Array.isArray(stateCode)
      ? stateCode[0].toUpperCase()
      : '';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header / breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin')}
            className="text-xs text-slate-400 hover:text-emerald-400 mb-1"
          >
            ← Back to admin overview
          </button>
          <h1 className="text-2xl font-semibold text-slate-100">
            {stateCodeParam || 'State'} overview
          </h1>
          <p className="text-sm text-slate-400">
            Labs, batches, and locations linked to{' '}
            <span className="font-mono text-slate-200">
              {stateCodeParam}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          className={`px-3 py-1.5 text-xs rounded-t-md ${
            tab === 'labs'
              ? 'bg-slate-900 text-emerald-300 border border-b-slate-900 border-slate-700 border-b-transparent'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setTab('labs')}
        >
          Labs
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded-t-md ${
            tab === 'batches'
              ? 'bg-slate-900 text-emerald-300 border border-b-slate-900 border-slate-700 border-b-transparent'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setTab('batches')}
        >
          Batches
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded-t-md ${
            tab === 'locations'
              ? 'bg-slate-900 text-emerald-300 border border-b-slate-900 border-slate-700 border-b-transparent'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setTab('locations')}
        >
          Locations
        </button>
      </div>

      {loading && !data && (
        <div className="text-sm text-slate-300">Loading state data…</div>
      )}

      {error && !data && (
        <div className="text-sm text-red-400">Error: {error}</div>
      )}

      {data && (
        <>
          {/* Quick stats row */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs text-slate-400 mb-1">Labs</div>
              <div className="text-2xl font-semibold text-slate-100">
                {data.labs.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs text-slate-400 mb-1">Batches</div>
              <div className="text-2xl font-semibold text-slate-100">
                {data.batches.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs text-slate-400 mb-1">Locations</div>
              <div className="text-2xl font-semibold text-slate-100">
                {data.locations.length}
              </div>
            </div>
          </div>

          {/* Tab content */}
          {tab === 'labs' && <LabsTab labs={data.labs} />}
          {tab === 'batches' && <BatchesTab batches={data.batches} />}
          {tab === 'locations' && <LocationsTab locations={data.locations} />}
        </>
      )}
    </div>
  );
}

// --- Labs tab ---

function LabsTab({ labs }: { labs: Lab[] }) {
  if (labs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-500">
        No labs recorded for this state yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Accreditation</th>
              <th className="py-2 pr-3">License</th>
              <th className="py-2 pr-3">Lab results</th>
            </tr>
          </thead>
          <tbody>
            {labs.map((lab) => {
              const resultCount = lab.labResults.length;
              const passCount = lab.labResults.filter(
                (r) => r.passed === true
              ).length;
              const failCount = lab.labResults.filter(
                (r) => r.passed === false
              ).length;

              return (
                <tr
                  key={lab.id}
                  className="border-b border-slate-900/70 hover:bg-slate-900/80"
                >
                  <td className="py-2 pr-3 text-slate-100">
                    {lab.name}
                    {lab.website && (
                      <div className="text-[10px] text-emerald-300">
                        <a
                          href={lab.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {lab.website}
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-300">
                    {lab.city || '—'}
                    {lab.stateCode ? `, ${lab.stateCode}` : ''}
                  </td>
                  <td className="py-2 pr-3 text-slate-300">
                    {lab.accreditation || '—'}
                    {lab.reliabilityScore != null && (
                      <div className="text-[10px] text-slate-500">
                        Reliability: {lab.reliabilityScore.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-300">
                    {lab.stateLicense ? (
                      <div className="space-y-0.5">
                        <div>{lab.stateLicense.licenseNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          {lab.stateLicense.licenseType} ·{' '}
                          {lab.stateLicense.status}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-300">
                    {resultCount === 0 ? (
                      <span className="text-slate-500">None</span>
                    ) : (
                      <div className="space-y-0.5">
                        <div>{resultCount} total</div>
                        <div className="text-[10px] text-emerald-300">
                          {passCount} pass
                        </div>
                        <div className="text-[10px] text-red-300">
                          {failCount} fail
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Batches tab ---

function BatchesTab({ batches }: { batches: Batch[] }) {
  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-500">
        No batches recorded for this state yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 pr-3">Batch</th>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Brand</th>
              <th className="py-2 pr-3">Ratings</th>
              <th className="py-2 pr-3">Lab results</th>
              <th className="py-2 pr-3">Locations</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const passCount = b.labResults.filter(
                (r) => r.passed === true
              ).length;
              const failCount = b.labResults.filter(
                (r) => r.passed === false
              ).length;

              return (
                <tr
                  key={b.id}
                  className="border-b border-slate-900/70 hover:bg-slate-900/80"
                >
                  <td className="py-2 pr-3 text-slate-100 font-mono">
                    {b.batchCode}
                    {b.jurisdiction && (
                      <div className="text-[10px] text-slate-500">
                        Jurisdiction: {b.jurisdiction}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-200">
                    {b.productName || '—'}
                  </td>
                  <td className="py-2 pr-3 text-slate-200">
                    {b.brand ? b.brand.name : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-200">
                    {b.reviewAggregate ? (
                      <div className="space-y-0.5">
                        <div className="text-emerald-300">
                          ★ {b.reviewAggregate.ratingAvg.toFixed(1)} / 5
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {b.reviewAggregate.ratingCount}{' '}
                          {b.reviewAggregate.ratingCount === 1
                            ? 'rating'
                            : 'ratings'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500">No ratings</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-200">
                    {b.labResults.length === 0 ? (
                      <span className="text-slate-500">None</span>
                    ) : (
                      <div className="space-y-0.5">
                        <div>{b.labResults.length} total</div>
                        <div className="text-[10px] text-emerald-300">
                          {passCount} pass
                        </div>
                        <div className="text-[10px] text-red-300">
                          {failCount} fail
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-200">
                    {b.locations.length === 0 ? (
                      <span className="text-slate-500">None</span>
                    ) : (
                      <div className="space-y-0.5">
                        {b.locations.slice(0, 3).map((bl) => (
                          <div key={bl.id}>
                            {bl.location.name}{' '}
                            <span className="text-[10px] text-slate-500">
                              {bl.location.city || '—'}
                              {bl.location.state
                                ? `, ${bl.location.state}`
                                : ''}
                            </span>
                          </div>
                        ))}
                        {b.locations.length > 3 && (
                          <div className="text-[10px] text-slate-500">
                            + {b.locations.length - 3} more…
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Locations tab ---

function LocationsTab({ locations }: { locations: Location[] }) {
  if (locations.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-500">
        No locations recorded for this state yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Brand</th>
              <th className="py-2 pr-3">License</th>
              <th className="py-2 pr-3">Batches</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr
                key={loc.id}
                className="border-b border-slate-900/70 hover:bg-slate-900/80"
              >
                <td className="py-2 pr-3 text-slate-100">
                  {loc.name}
                  <div className="text-[10px] text-slate-500">
                    {loc.city || '—'}
                    {loc.state ? `, ${loc.state}` : ''}
                  </div>
                </td>
                <td className="py-2 pr-3 text-slate-300">{loc.type}</td>
                <td className="py-2 pr-3 text-slate-300">
                  {loc.brand ? (
                    loc.brand.name
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-300">
                  {loc.stateLicense ? (
                    <div className="space-y-0.5">
                      <div>{loc.stateLicense.licenseNumber}</div>
                      <div className="text-[10px] text-slate-500">
                        {loc.stateLicense.licenseType} ·{' '}
                        {loc.stateLicense.status}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-slate-300">
                  {loc.batchLinks.length === 0 ? (
                    <span className="text-slate-500">None</span>
                  ) : (
                    <div className="space-y-0.5">
                      {loc.batchLinks.slice(0, 3).map((bl) => (
                        <div key={bl.id} className="font-mono">
                          {bl.batch?.batchCode || '—'}
                        </div>
                      ))}
                      {loc.batchLinks.length > 3 && (
                        <div className="text-[10px] text-slate-500">
                          + {loc.batchLinks.length - 3} more…
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
