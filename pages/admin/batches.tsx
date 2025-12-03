import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type BrandRef = {
  id: number;
  name: string;
};

type ReviewAggregate = {
  ratingAvg: number;
  ratingCount: number;
};

type Batch = {
  id: number;
  batchCode: string;
  productName?: string | null;
  productSku?: string | null;
  primaryCategory?: string | null;
  subCategory?: string | null;
  brandId?: number | null;
  harvestDate?: string | null;
  productionDate?: string | null;
  packageDate?: string | null;
  expirationDate?: string | null;
  isActive: boolean;
  notes?: string | null;
  brand?: BrandRef | null;
  reviewAggregate?: ReviewAggregate | null;
};

export default function AdminBatches() {
  const { data: session } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [brands, setBrands] = useState<BrandRef[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchBatches();
      fetchBrands();
    }
  }, [session]);

  async function fetchBatches(q?: string) {
    try {
      setLoading(true);
      setError(null);
      const url =
        q && q.trim().length > 0
          ? `/api/admin/batches?q=${encodeURIComponent(q)}`
          : '/api/admin/batches';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Normalize dates to yyyy-mm-dd for inputs
        const normalized = data.map((b: any) => ({
          ...b,
          harvestDate: b.harvestDate ? b.harvestDate.slice(0, 10) : null,
          productionDate: b.productionDate
            ? b.productionDate.slice(0, 10)
            : null,
          packageDate: b.packageDate ? b.packageDate.slice(0, 10) : null,
          expirationDate: b.expirationDate
            ? b.expirationDate.slice(0, 10)
            : null,
        }));
        setBatches(normalized);
      } else {
        setBatches([]);
      }
    } catch (e: any) {
      console.error('Failed to fetch batches', e);
      setError('Failed to load batches.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBrands() {
    try {
      const res = await fetch('/api/admin/brands');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setBrands(data);
      }
    } catch (e) {
      console.error('Failed to fetch brands', e);
    }
  }

  function emptyBatch(): Batch {
    return {
      id: 0,
      batchCode: '',
      productName: '',
      productSku: '',
      primaryCategory: '',
      subCategory: '',
      brandId: null,
      harvestDate: null,
      productionDate: null,
      packageDate: null,
      expirationDate: null,
      isActive: true,
      notes: '',
      brand: null,
      reviewAggregate: null,
    };
  }

  function startCreate() {
    setEditing(emptyBatch());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startEdit(b: Batch) {
    setEditing(b);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveBatch() {
    if (!editing) return;
    if (!editing.batchCode) {
      setError('Batch code is required.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const method = editing.id && editing.id !== 0 ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/batches', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save batch.');
      }
      await res.json();
      setEditing(null);
      fetchBatches(search);
    } catch (e: any) {
      console.error('Failed to save batch', e);
      setError(e.message || 'Failed to save batch.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteBatch(id: number) {
    if (!confirm('Delete this batch?')) return;
    try {
      await fetch(`/api/admin/batches?id=${id}`, { method: 'DELETE' });
      fetchBatches(search);
    } catch (e) {
      console.error('Failed to delete batch', e);
    }
  }

  function renderRating(b: Batch) {
    if (!b.reviewAggregate || b.reviewAggregate.ratingCount === 0) {
      return <span className="text-xs text-slate-500">No ratings yet</span>;
    }
    const { ratingAvg, ratingCount } = b.reviewAggregate;
    return (
      <span className="text-xs text-emerald-300">
        ★ {ratingAvg.toFixed(1)} / 5 ({ratingCount})
      </span>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to manage batches.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Batches</h1>
          <p className="text-sm text-slate-400">
            Create and manage batch records, link them to brands, and view
            aggregate ratings.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400"
        >
          + New batch
        </button>
      </div>

      {/* Editor card */}
      {editing && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <h2 className="font-semibold text-slate-100">
            {editing.id && editing.id !== 0 ? 'Edit batch' : 'Create new batch'}
          </h2>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-700/60 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">
                Batch code <span className="text-red-400">*</span>
              </label>
              <input
                value={editing.batchCode}
                onChange={(e) =>
                  setEditing({ ...editing, batchCode: e.target.value })
                }
                placeholder="e.g. BATCH-123456"
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Product name</label>
              <input
                value={editing.productName || ''}
                onChange={(e) =>
                  setEditing({ ...editing, productName: e.target.value })
                }
                placeholder="e.g. Wedding Cake 3.5g"
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Primary category</label>
              <input
                value={editing.primaryCategory || ''}
                onChange={(e) =>
                  setEditing({ ...editing, primaryCategory: e.target.value })
                }
                placeholder="flower, vape, edible..."
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Subcategory</label>
              <input
                value={editing.subCategory || ''}
                onChange={(e) =>
                  setEditing({ ...editing, subCategory: e.target.value })
                }
                placeholder="live resin, distillate, chocolate..."
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Brand</label>
              <select
                value={editing.brandId ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    brandId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 text-sm"
              >
                <option value="">No brand / independent</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Product SKU (optional)</label>
              <input
                value={editing.productSku || ''}
                onChange={(e) =>
                  setEditing({ ...editing, productSku: e.target.value })
                }
                placeholder="internal SKU"
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Harvest date</label>
              <input
                type="date"
                value={editing.harvestDate || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    harvestDate: e.target.value || null,
                  })
                }
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Production date</label>
              <input
                type="date"
                value={editing.productionDate || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    productionDate: e.target.value || null,
                  })
                }
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Package date</label>
              <input
                type="date"
                value={editing.packageDate || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    packageDate: e.target.value || null,
                  })
                }
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Expiration date</label>
              <input
                type="date"
                value={editing.expirationDate || ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    expirationDate: e.target.value || null,
                  })
                }
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-2 col-span-2">
              <label className="inline-flex items-center gap-2 text-slate-300 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) =>
                    setEditing({ ...editing, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                />
                Active batch (currently in circulation)
              </label>
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-slate-300">Notes</label>
              <textarea
                value={editing.notes || ''}
                onChange={(e) =>
                  setEditing({ ...editing, notes: e.target.value })
                }
                placeholder="Internal notes about this batch, anomalies, etc."
                className="p-2 rounded-md bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={saveBatch}
              disabled={saving}
              className="px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save batch'}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-3 py-1.5 rounded-md border border-slate-700 text-sm text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + list */}
      <div className="flex items-center justify-between gap-4">
        <input
          placeholder="Search by batch code, product, brand, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => fetchBatches(search)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              fetchBatches(search);
            }
          }}
          className="flex-1 p-2 rounded-md bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <button
          onClick={() => fetchBatches(search)}
          className="px-3 py-1.5 rounded-md border border-slate-700 text-xs text-slate-200"
        >
          Apply
        </button>
      </div>

      <div className="grid gap-3">
        {loading && (
          <div className="text-sm text-slate-400">Loading batches...</div>
        )}

        {!loading && batches.length === 0 && (
          <div className="text-xs text-slate-500">
            No batches found. Create your first batch above.
          </div>
        )}

        {batches.map((b) => (
          <div
            key={b.id}
            className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 flex justify-between items-center gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-slate-100">
                  {b.productName || b.batchCode}
                </div>
                {!b.isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">
                    Inactive
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                <span className="mr-2">
                  <span className="font-mono text-slate-300">
                    {b.batchCode}
                  </span>
                </span>
                {b.primaryCategory && (
                  <span className="mr-2">{b.primaryCategory}</span>
                )}
                {b.brand && (
                  <span className="mr-2 text-slate-300">· {b.brand.name}</span>
                )}
              </div>
              <div>{renderRating(b)}</div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/batches/${b.id}`}
                className="px-2 py-1 border border-slate-700 rounded text-xs text-slate-200"
              >
                View
              </Link>
              <button
                onClick={() => startEdit(b)}
                className="px-2 py-1 border border-slate-700 rounded text-xs text-slate-200"
              >
                Edit
              </button>
              <button
                onClick={() => deleteBatch(b.id)}
                className="px-2 py-1 border border-red-500/60 text-red-400 rounded text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
