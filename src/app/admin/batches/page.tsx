// src/app/admin/batches/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type BrandRef = { id: number; name: string };
type ReviewAggregate = { ratingAvg: number; ratingCount: number };
interface Batch {
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
}

export default function AdminBatchesPage() {
  const { data: session } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [brands, setBrands] = useState<BrandRef[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchBatches();
      fetchBrands();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function fetchBatches(query?: string) {
    try {
      setLoading(true);
      setError(null);
      const url =
        query && query.trim().length > 0
          ? `/api/admin/batches?q=${encodeURIComponent(query)}`
          : "/api/admin/batches";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Normalize date strings to YYYY-MM-DD for form inputs
        const normalized = data.map((b: any) => ({
          ...b,
          harvestDate: b.harvestDate ? b.harvestDate.slice(0, 10) : null,
          productionDate: b.productionDate ? b.productionDate.slice(0, 10) : null,
          packageDate: b.packageDate ? b.packageDate.slice(0, 10) : null,
          expirationDate: b.expirationDate ? b.expirationDate.slice(0, 10) : null,
        }));
        setBatches(normalized);
      } else {
        setError("Failed to load batches.");
      }
    } catch (err) {
      console.error("Failed to load batches", err);
      setError("Failed to load batches.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBrands() {
    try {
      const res = await fetch("/api/admin/brands");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBrands(data);
      }
    } catch (err) {
      console.error("Failed to load brands", err);
    }
  }

  function startCreate() {
    setEditing({
      id: 0,
      batchCode: "",
      isActive: true,
      productName: "",
      productSku: "",
      primaryCategory: "",
      subCategory: "",
      brandId: undefined,
      harvestDate: null,
      productionDate: null,
      packageDate: null,
      expirationDate: null,
      notes: "",
    });
  }

  function startEdit(batch: Batch) {
    setEditing({ ...batch });
  }

  async function saveBatch() {
    if (!editing) return;
    try {
      setSaving(true);
      setError(null);
      const method = editing.id === 0 ? "POST" : "PUT";
      const endpoint = editing.id === 0 ? "/api/admin/batches" : `/api/admin/batches/${editing.id}`;
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      // Reload list and reset form
      await fetchBatches(search);
      setEditing(null);
    } catch (err) {
      console.error("Error saving batch:", err);
      setError("Failed to save batch. Please check the data and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBatch(batchId: number) {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      const res = await fetch(`/api/admin/batches/${batchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
    } catch (err) {
      console.error("Error deleting batch:", err);
      alert("Failed to delete batch.");
    }
  }

  // If not logged in (shouldn't happen due to layout guard), just return nothing
  if (!session) return null;

  // Simple component to show average review rating, if present
  const Rating: React.FC<{ ratingAvg: number; ratingCount: number }> = ({ ratingAvg, ratingCount }) => {
    return (
      <span className="text-xs text-emerald-400">
        ★ {ratingAvg.toFixed(1)} / 5 ({ratingCount})
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header and search bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Batches</h1>
          <p className="text-sm text-slate-400">
            View and manage cannabis production batches. Each batch links products, lab results, and inventory.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <input
            type="text"
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 placeholder-slate-500"
          />
          <button
            onClick={() => fetchBatches(search)}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            Search
          </button>
          <button
            onClick={startCreate}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-slate-100 hover:bg-emerald-500"
          >
            + New Batch
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Batches Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-200 text-left text-xs uppercase">
            <tr>
              <th className="py-2 px-3">Batch Code</th>
              <th className="py-2 px-3">Product</th>
              <th className="py-2 px-3">Brand</th>
              <th className="py-2 px-3">Dates</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Reviews</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                <td className="py-1.5 px-3">{b.batchCode}</td>
                <td className="py-1.5 px-3">
                  <div>{b.productName || <span className="text-slate-500">Unnamed Product</span>}</div>
                  <div className="text-xs text-slate-500">{b.primaryCategory}{b.subCategory ? ` / ${b.subCategory}` : ""}</div>
                </td>
                <td className="py-1.5 px-3">{b.brand?.name || <span className="text-slate-500">–</span>}</td>
                <td className="py-1.5 px-3 text-xs">
                  {b.harvestDate && <div>Harvest: {b.harvestDate}</div>}
                  {b.productionDate && <div>Production: {b.productionDate}</div>}
                  {b.packageDate && <div>Packaged: {b.packageDate}</div>}
                  {b.expirationDate && <div>Exp: {b.expirationDate}</div>}
                  {!b.harvestDate && !b.productionDate && !b.packageDate && !b.expirationDate && <span className="text-slate-500">–</span>}
                </td>
                <td className="py-1.5 px-3">
                  {b.isActive ? <span className="text-emerald-400">Active</span> : <span className="text-slate-500">Inactive</span>}
                </td>
                <td className="py-1.5 px-3">
                  {b.reviewAggregate ? (
                    <Rating ratingAvg={b.reviewAggregate.ratingAvg} ratingCount={b.reviewAggregate.ratingCount} />
                  ) : (
                    <span className="text-slate-500 text-xs">No reviews</span>
                  )}
                </td>
                <td className="py-1.5 px-3 text-right">
                  <button onClick={() => startEdit(b)} className="mr-2 text-emerald-400 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => deleteBatch(b.id)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {batches.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="py-2 px-3 text-center text-slate-500">
                  No batches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Loading indicator */}
      {loading && <p className="text-sm text-slate-400">Loading batches…</p>}

      {/* Edit/Create Form Modal */}
      {editing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {editing.id === 0 ? "Add New Batch" : "Edit Batch"}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-200">Batch Code</label>
                <input
                  type="text"
                  value={editing.batchCode}
                  onChange={(e) => setEditing({ ...editing, batchCode: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1"
                />
              </div>
              <div>
                <label className="block text-slate-200">Product Name</label>
                <input
                  type="text"
                  value={editing.productName || ""}
                  onChange={(e) => setEditing({ ...editing, productName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-slate-200">Primary Category</label>
                  <input
                    type="text"
                    value={editing.primaryCategory || ""}
                    onChange={(e) => setEditing({ ...editing, primaryCategory: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-slate-200">Sub Category</label>
                  <input
                    type="text"
                    value={editing.subCategory || ""}
                    onChange={(e) => setEditing({ ...editing, subCategory: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-200">Product SKU</label>
                <input
                  type="text"
                  value={editing.productSku || ""}
                  onChange={(e) => setEditing({ ...editing, productSku: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1"
                />
              </div>
              <div>
                <label className="block text-slate-200">Brand</label>
                <select
                  value={editing.brandId ?? ""}
                  onChange={(e) => setEditing({ ...editing, brandId: e.target.value ? Number(e.target.value) : undefined })}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1"
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((br) => (
                    <option key={br.id} value={br.id}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-slate-200">Harvest Date</label>
                  <input
                    type="date"
                    value={editing.harvestDate || ""}
                    onChange={(e) => setEditing({ ...editing, harvestDate: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-slate-200">Production Date</label>
                  <input
                    type="date"
                    value={editing.productionDate || ""}
                    onChange={(e) => setEditing({ ...editing, productionDate: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-slate-200">Package Date</label>
                  <input
                    type="date"
                    value={editing.packageDate || ""}
                    onChange={(e) => setEditing({ ...editing, packageDate: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-slate-200">Expiration Date</label>
                  <input
                    type="date"
                    value={editing.expirationDate || ""}
                    onChange={(e) => setEditing({ ...editing, expirationDate: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-200">Notes</label>
                <textarea
                  value={editing.notes || ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="mr-2 h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-600"
                />
                <label htmlFor="isActive" className="text-slate-200">Batch is active</label>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={saveBatch}
                disabled={saving}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white enabled:hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : editing.id === 0 ? "Create Batch" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
