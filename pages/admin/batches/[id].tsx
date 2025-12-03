import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

type Brand = {
  id: number;
  name: string;
};

type ReviewAggregate = {
  ratingAvg: number;
  ratingCount: number;
};

type RatingSource = {
  id: number;
  source: string;
  ratingAvg: number;
  ratingCount: number;
};

type Lab = {
  id: number;
  name: string;
};

type UploadedDocument = {
  id: number;
  fileName: string;
};

type LabResult = {
  id: number;
  testedAt?: string | null;
  reportedAt?: string | null;
  thcPercent?: number | null;
  cbdPercent?: number | null;
  totalCannabinoidsPercent?: number | null;
  passed?: boolean | null;
  lab?: Lab | null;
  uploadedDocument?: UploadedDocument | null;
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

type VerificationEvent = {
  id: number;
  status: string;
  reason?: string | null;
  createdAt: string;
  createdBy?: string | null;
};

type Recall = {
  id: number;
  jurisdiction: string;
  recallNumber?: string | null;
  status: string;
  reason?: string | null;
  issuedAt?: string | null;
};

type BatchDetail = {
  id: number;
  batchCode: string;
  productName?: string | null;
  productSku?: string | null;
  primaryCategory?: string | null;
  subCategory?: string | null;
  brand?: Brand | null;
  harvestDate?: string | null;
  productionDate?: string | null;
  packageDate?: string | null;
  expirationDate?: string | null;
  isActive: boolean;
  notes?: string | null;
  reviewAggregate?: ReviewAggregate | null;
  ratingSources: RatingSource[];
  labResults: LabResult[];
  locations: BatchLocation[];
  verifications: VerificationEvent[];
  recalls: Recall[];
};

function formatDate(s?: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

function latestVerification(verifications: VerificationEvent[]) {
  if (!verifications || verifications.length === 0) return null;
  return verifications[0];
}

function overallStatus(batch: BatchDetail) {
  const latest = latestVerification(batch.verifications);
  const hasActiveRecall = batch.recalls.some((r) => r.status === 'ACTIVE');

  if (hasActiveRecall) return 'RECALLED';
  if (latest?.status === 'FLAGGED') return 'FLAGGED';
  if (latest?.status === 'REJECTED') return 'REJECTED';
  if (latest?.status === 'VERIFIED') return 'VERIFIED';
  return 'UNVERIFIED';
}

export default function AdminBatchDetail() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: track which lab result is being deleted
  const [deletingLabResultId, setDeletingLabResultId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!id || !session) return;
    fetchBatch(id);
  }, [id, session]);

  async function fetchBatch(batchId: string | string[]) {
    try {
      setLoading(true);
      setError(null);
      const idStr = Array.isArray(batchId) ? batchId[0] : batchId;
      const res = await fetch(`/api/admin/batches/${idStr}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to load batch');
      }
      const data = await res.json();
      setBatch(data);
    } catch (e: any) {
      console.error('Failed to load batch', e);
      setError(e.message || 'Failed to load batch');
    } finally {
      setLoading(false);
    }
  }

  // NEW: delete COA / lab result handler
  async function handleDeleteLabResult(labResultId: number) {
    if (!id) return;

    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        'Delete this COA and its lab result from this batch? This cannot be undone.',
      );
      if (!ok) return;
    }

    try {
      setDeletingLabResultId(labResultId);
      setError(null);

      const res = await fetch(`/api/admin/lab-results/${labResultId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to delete lab result / COA');
      }

      await fetchBatch(id);
    } catch (e: any) {
      console.error('Failed to delete lab result / COA', e);
      setError(e.message || 'Failed to delete lab result / COA');
    } finally {
      setDeletingLabResultId(null);
    }
  }

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to view batch details.
        </p>
      </div>
    );
  }

  if (loading && !batch) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">Loading batch…</p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">Batch not found.</p>
      </div>
    );
  }

  const status = overallStatus(batch);
  const ver = latestVerification(batch.verifications);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top bar / breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/batches')}
            className="text-xs text-slate-400 hover:text-emerald-400 mb-1"
          >
            ← Back to batches
          </button>
          <h1 className="text-2xl font-semibold text-slate-100">
            {batch.productName || batch.batchCode}
          </h1>
          <p className="text-sm text-slate-400">
            Batch code{' '}
            <span className="font-mono text-slate-200">{batch.batchCode}</span>
            {batch.brand && (
              <>
                {' '}
                · Brand:{' '}
                <span className="text-slate-100">{batch.brand.name}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Status pill */}
          <div className="flex gap-2">
            <span
              className={`px-2 py-1 rounded-full text-[11px] border ${
                status === 'VERIFIED'
                  ? 'border-emerald-500 text-emerald-300'
                  : status === 'RECALLED'
                    ? 'border-red-500 text-red-300'
                    : status === 'FLAGGED' || status === 'REJECTED'
                      ? 'border-amber-500 text-amber-300'
                      : 'border-slate-600 text-slate-300'
              }`}
            >
              {status}
            </span>
            {!batch.isActive && (
              <span className="px-2 py-1 rounded-full text-[11px] border border-slate-600 text-slate-400">
                Inactive
              </span>
            )}
          </div>

          {/* Rating summary */}
          {batch.reviewAggregate ? (
            <div className="text-xs text-emerald-300">
              ★ {batch.reviewAggregate.ratingAvg.toFixed(1)} / 5 ({' '}
              {batch.reviewAggregate.ratingCount}{' '}
              {batch.reviewAggregate.ratingCount === 1 ? 'rating' : 'ratings'})
            </div>
          ) : (
            <div className="text-xs text-slate-500">No ratings yet</div>
          )}
        </div>
      </div>

      {/* Error banner if something went wrong but we still have data */}
      {error && batch && (
        <div className="text-xs text-red-300 bg-red-950/40 border border-red-700/60 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Layout: left = overview, right = status/recall */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        {/* Overview card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">
            Overview
          </h2>
          <div className="grid text-sm gap-2 md:grid-cols-2">
            <div>
              <div className="text-xs text-slate-400">Batch code</div>
              <div className="font-mono text-slate-100">{batch.batchCode}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Product</div>
              <div className="text-slate-100">{batch.productName || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Category</div>
              <div className="text-slate-100">
                {batch.primaryCategory || '—'}
                {batch.subCategory ? ` · ${batch.subCategory}` : ''}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">SKU</div>
              <div className="text-slate-100">{batch.productSku || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Harvest date</div>
              <div className="text-slate-100">
                {formatDate(batch.harvestDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Production date</div>
              <div className="text-slate-100">
                {formatDate(batch.productionDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Package date</div>
              <div className="text-slate-100">
                {formatDate(batch.packageDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Expiration date</div>
              <div className="text-slate-100">
                {formatDate(batch.expirationDate)}
              </div>
            </div>
          </div>

          {batch.notes && (
            <div className="pt-2 border-t border-slate-800 mt-2">
              <div className="text-xs text-slate-400 mb-1">Notes</div>
              <p className="text-xs text-slate-200 whitespace-pre-wrap">
                {batch.notes}
              </p>
            </div>
          )}
        </div>

        {/* Status / recall / verification */}
        <div className="space-y-4">
          {/* Verification card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              Verification
            </h2>
            {ver ? (
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Latest status</div>
                <div className="text-slate-100">
                  {ver.status}{' '}
                  <span className="text-xs text-slate-500">
                    on {formatDate(ver.createdAt)}
                    {ver.createdBy ? ` by ${ver.createdBy}` : ''}
                  </span>
                </div>
                {ver.reason && (
                  <div className="text-xs text-slate-300 mt-1">
                    {ver.reason}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                No verification events recorded yet.
              </div>
            )}
          </div>

          {/* Recalls card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              Recalls
            </h2>
            {batch.recalls.length === 0 ? (
              <div className="text-xs text-slate-500">
                No recalls recorded for this batch.
              </div>
            ) : (
              <div className="space-y-2">
                {batch.recalls.map((r) => (
                  <div
                    key={r.id}
                    className="border border-slate-800 rounded-md px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-300">
                        {r.jurisdiction}{' '}
                        {r.recallNumber ? `· ${r.recallNumber}` : ''}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          r.status === 'ACTIVE'
                            ? 'border-red-500 text-red-300'
                            : 'border-slate-600 text-slate-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.reason && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        {r.reason}
                      </div>
                    )}
                    {r.issuedAt && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Issued: {formatDate(r.issuedAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lab results section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Lab results (COAs)
        </h2>
        {batch.labResults.length === 0 ? (
          <div className="text-xs text-slate-500">
            No lab results linked to this batch yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-3">Lab</th>
                  <th className="py-2 pr-3">Tested at</th>
                  <th className="py-2 pr-3">THC %</th>
                  <th className="py-2 pr-3">CBD %</th>
                  <th className="py-2 pr-3">Total cannabinoids %</th>
                  <th className="py-2 pr-3">Overall</th>
                  <th className="py-2 pr-3">COA</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batch.labResults.map((lr) => (
                  <tr
                    key={lr.id}
                    className="border-b border-slate-900/70 hover:bg-slate-900/80"
                  >
                    <td className="py-2 pr-3 text-slate-100">
                      {lr.lab?.name || '—'}
                    </td>
                    <td className="py-2 pr-3 text-slate-200">
                      {formatDate(lr.testedAt)}
                    </td>
                    <td className="py-2 pr-3 text-slate-200">
                      {lr.thcPercent != null
                        ? `${lr.thcPercent.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="py-2 pr-3 text-slate-200">
                      {lr.cbdPercent != null
                        ? `${lr.cbdPercent.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="py-2 pr-3 text-slate-200">
                      {lr.totalCannabinoidsPercent != null
                        ? `${lr.totalCannabinoidsPercent.toFixed(2)}%`
                        : '—'}
                    </td>
                    <td className="py-2 pr-3">
                      {lr.passed == null ? (
                        <span className="text-slate-500">Unknown</span>
                      ) : lr.passed ? (
                        <span className="text-emerald-300">Pass</span>
                      ) : (
                        <span className="text-red-300">Fail</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-slate-200">
                      {lr.uploadedDocument ? lr.uploadedDocument.fileName : '—'}
                    </td>
                    <td className="py-2 pr-3">
                      {lr.uploadedDocument ? (
                        <button
                          onClick={() => handleDeleteLabResult(lr.id)}
                          disabled={deletingLabResultId === lr.id}
                          className="text-[11px] px-2 py-1 rounded-md border border-red-600/70 text-red-300 hover:bg-red-900/40 disabled:opacity-60"
                        >
                          {deletingLabResultId === lr.id
                            ? 'Deleting…'
                            : 'Delete COA'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          No COA attached
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Locations section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Locations (where seen / sold)
        </h2>
        {batch.locations.length === 0 ? (
          <div className="text-xs text-slate-500">
            No locations linked to this batch yet.
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 text-xs">
            {batch.locations.map((bl) => (
              <div
                key={bl.id}
                className="border border-slate-800 rounded-md px-3 py-2"
              >
                <div className="text-slate-100">{bl.location.name}</div>
                <div className="text-slate-400">
                  {bl.location.city || '—'}, {bl.location.state || '—'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Type: {bl.location.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ratings section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Ratings (5-star aggregate)
        </h2>
        {batch.reviewAggregate ? (
          <div className="text-sm text-slate-200 mb-2">
            Overall:{' '}
            <span className="text-emerald-300 font-semibold">
              ★ {batch.reviewAggregate.ratingAvg.toFixed(1)} / 5
            </span>{' '}
            ({batch.reviewAggregate.ratingCount}{' '}
            {batch.reviewAggregate.ratingCount === 1 ? 'rating' : 'ratings'})
          </div>
        ) : (
          <div className="text-xs text-slate-500 mb-2">
            No aggregate rating computed for this batch yet.
          </div>
        )}

        {batch.ratingSources.length === 0 ? (
          <div className="text-xs text-slate-500">
            No source-specific rating data available.
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-3 text-xs">
            {batch.ratingSources.map((rs) => (
              <div
                key={rs.id}
                className="border border-slate-800 rounded-md px-3 py-2"
              >
                <div className="text-slate-200">{rs.source}</div>
                <div className="text-emerald-300">
                  ★ {rs.ratingAvg.toFixed(1)} / 5
                </div>
                <div className="text-slate-500">
                  {rs.ratingCount} {rs.ratingCount === 1 ? 'rating' : 'ratings'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification history section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Verification history
        </h2>
        {batch.verifications.length === 0 ? (
          <div className="text-xs text-slate-500">
            No verification events yet.
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {batch.verifications.map((v) => (
              <div
                key={v.id}
                className="border border-slate-800 rounded-md px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <div className="text-slate-200">{v.status}</div>
                  <div className="text-slate-500">
                    {formatDate(v.createdAt)}
                    {v.createdBy ? ` · ${v.createdBy}` : ''}
                  </div>
                </div>
                {v.reason && (
                  <div className="text-slate-300 mt-1">{v.reason}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
