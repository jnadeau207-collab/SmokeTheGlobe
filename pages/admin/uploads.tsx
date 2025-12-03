import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Location = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
  type: string;
};

type BatchLocation = {
  id: number;
  location: Location;
};

type Brand = {
  id: number;
  name: string;
};

type Batch = {
  id: number;
  batchCode: string;
  productName?: string | null;
  brand?: Brand | null;
  locations: BatchLocation[];
};

type Lab = {
  id: number;
  name: string;
};

type LabResult = {
  id: number;
  thcPercent?: number | null;
  cbdPercent?: number | null;
  totalCannabinoidsPercent?: number | null;
  passed?: boolean | null;
  lab?: Lab | null;
  batch?: Batch | null;
};

type UploadedDocument = {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  batchCode?: string | null;
  labName?: string | null;
  createdAt: string;
  verified: boolean;
  extractedText?: string | null;
  labResult?: LabResult | null;
};

export default function AdminUploads() {
  const router = useRouter();
  const { data: session } = useSession();
  const [docs, setDocs] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [savingSelected, setSavingSelected] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (session) {
      fetchDocs();
    }
  }, [session]);

  async function fetchDocs() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/uploads');
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to load uploads');
      }
      const data = await res.json();
      setDocs(data);
    } catch (e: any) {
      console.error('Failed to fetch uploads', e);
      setError(e.message || 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File | null;

    if (!file) {
      setError('Please choose a PDF file.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    try {
      setUploading(true);
      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Upload failed');
      }

      const data = await res.json();
      if (data.reused) {
        setSuccessMessage(
          `This COA was already uploaded (document #${data.document.id}).`,
        );
      } else {
        setSuccessMessage(
          `Uploaded COA as document #${data.document.id}${
            data.labResult ? `; created lab result #${data.labResult.id}` : ''
          }.`,
        );
      }

      form.reset();
      fetchDocs();
    } catch (err: any) {
      console.error('Upload error', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function openDoc(id: number) {
    try {
      setSelectedLoading(true);
      setError(null);
      setSuccessMessage(null);
      const res = await fetch(`/api/admin/uploads/${id}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to load document');
      }
      const data = await res.json();
      setSelectedDoc(data);
    } catch (e: any) {
      console.error('Failed to load document', e);
      setError(e.message || 'Failed to load document');
    } finally {
      setSelectedLoading(false);
    }
  }

  async function saveSelected() {
    if (!selectedDoc) return;
    try {
      setSavingSelected(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/admin/uploads/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchCode: selectedDoc.batchCode,
          labName: selectedDoc.labName,
          verified: selectedDoc.verified,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to save document');
      }

      const updated = await res.json();
      setSelectedDoc((prev) => (prev ? { ...prev, ...updated } : prev));
      setDocs((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)),
      );
      setSuccessMessage(`Updated COA #${updated.id} (batch code & lab name).`);
    } catch (e: any) {
      console.error('Failed to save document', e);
      setError(e.message || 'Failed to save document');
    } finally {
      setSavingSelected(false);
    }
  }

  async function deleteDoc(id: number) {
    if (!confirm('Delete this COA and its linked lab result (if any)?')) return;
    try {
      setDeleteBusyId(id);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/admin/uploads/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to delete document');
      }

      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc && selectedDoc.id === id) {
        setSelectedDoc(null);
      }
      setSuccessMessage(`Deleted COA #${id}.`);
    } catch (e: any) {
      console.error('Failed to delete document', e);
      setError(e.message || 'Failed to delete document');
    } finally {
      setDeleteBusyId(null);
    }
  }

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to upload COA PDFs.
        </p>
      </div>
    );
  }

  // Helpers for the â€œinfo dialogâ€ legacy panel
  function getProducerName(doc: UploadedDocument) {
    const batch = doc.labResult?.batch;
    return (
      batch?.brand?.name ||
      batch?.productName ||
      doc.labName ||
      'Unknown producer'
    );
  }

  function getProducerLocation(doc: UploadedDocument) {
    const batch = doc.labResult?.batch;
    if (!batch || !batch.locations || batch.locations.length === 0) return null;

    // Just grab the first location for now
    const loc = batch.locations[0].location;
    const parts = [loc.name, loc.city, loc.state].filter(Boolean);
    return parts.join(', ');
  }

  function getRetailerList(doc: UploadedDocument) {
    const batch = doc.labResult?.batch;
    if (!batch || !batch.locations || batch.locations.length === 0) return [];
    return batch.locations.map((bl) => bl.location);
  }

  function getPotencySummary(doc: UploadedDocument) {
    const lr = doc.labResult;
    if (!lr) return 'No potency data linked yet.';
    const pieces: string[] = [];
    if (lr.thcPercent != null) pieces.push(`THC ${lr.thcPercent.toFixed(2)}%`);
    if (lr.cbdPercent != null) pieces.push(`CBD ${lr.cbdPercent.toFixed(2)}%`);
    if (lr.totalCannabinoidsPercent != null)
      pieces.push(
        `Total cannabinoids ${lr.totalCannabinoidsPercent.toFixed(2)}%`,
      );
    if (pieces.length === 0) return 'No potency data linked yet.';
    return pieces.join(' Â· ');
  }

  function getSafetySummary(doc: UploadedDocument) {
    const lr = doc.labResult;
    if (!lr || lr.passed == null) {
      return 'No overall safety judgement recorded.';
    }
    return lr.passed
      ? 'Overall outcome: PASS (no issues detected in recorded tests).'
      : 'Overall outcome: FAIL (one or more tests did not meet thresholds).';
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">COA uploads</h1>
        <p className="text-sm text-slate-400">
          Upload raw PDF lab reports. CartFax will store the file, extract text,
          attempt to detect batch codes and lab names, and optionally create a
          linked batch + lab result. You can refine metadata and view a quick
          at-a-glance info card here, or open the full debug view for deeper
          parsing work.
        </p>
      </div>

      {/* Upload form */}
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3"
      >
        <div className="text-sm font-medium text-slate-200">
          Upload a COA PDF
        </div>
        <p className="text-xs text-slate-400">
          Supports one PDF at a time. Files are hashed to avoid duplicates.
        </p>

        {error && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-700/60 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="text-xs text-emerald-300 bg-emerald-900/40 border border-emerald-700/60 rounded-md px-3 py-2">
            {successMessage}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input
            type="file"
            name="file"
            accept="application/pdf"
            className="text-xs text-slate-200 file:border-0 file:bg-slate-800 file:text-slate-100 file:px-3 file:py-1.5 file:rounded-md file:text-xs"
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-60"
          >
            {uploading ? 'Uploadingâ€¦' : 'Upload COA'}
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        {/* List of uploaded docs */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Uploaded documents
            </h2>
            <button
              onClick={fetchDocs}
              className="px-2 py-1 rounded-md border border-slate-700 text-xs text-slate-200"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="text-xs text-slate-400">Loading uploadsâ€¦</div>
          )}

          {!loading && docs.length === 0 && (
            <div className="text-xs text-slate-500">
              No COAs uploaded yet. Upload your first PDF above.
            </div>
          )}

          {!loading && docs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">File</th>
                    <th className="py-2 pr-3">Batch code</th>
                    <th className="py-2 pr-3">Lab name</th>
                    <th className="py-2 pr-3">Size</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-3">LabResult</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr
                      key={d.id}
                      className={`border-b border-slate-900/70 hover:bg-slate-900/80 ${
                        selectedDoc && selectedDoc.id === d.id
                          ? 'bg-slate-900/80'
                          : ''
                      }`}
                    >
                      <td className="py-2 pr-3 text-slate-300">{d.id}</td>
                      <td className="py-2 pr-3 text-slate-100">{d.fileName}</td>
                      <td className="py-2 pr-3 text-slate-200">
                        {d.batchCode || (
                          <span className="text-slate-500">Not detected</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-slate-200">
                        {d.labName || (
                          <span className="text-slate-500">Not detected</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        {(d.size / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        {d.labResult ? (
                          <span className="text-emerald-300">
                            #{d.labResult.id}
                          </span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDoc(d.id)}
                            className="text-[11px] px-2 py-1 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
                          >
                            View / Edit
                          </button>

                          <button
                            onClick={() =>
                              router.push(`/admin/uploads/${d.id}`)
                            }
                            className="text-[11px] px-2 py-1 rounded-md border border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/40"
                          >
                            Full debug
                          </button>

                          <button
                            onClick={() => deleteDoc(d.id)}
                            disabled={deleteBusyId === d.id}
                            className="text-[11px] px-2 py-1 rounded-md border border-red-600/70 text-red-300 hover:bg-red-900/40 disabled:opacity-60"
                          >
                            {deleteBusyId === d.id ? 'Deletingâ€¦' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legacy â€œinfo dialogâ€ panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">
            COA info panel
          </h2>
          {selectedLoading && (
            <div className="text-xs text-slate-400 mb-2">
              Loading document detailsâ€¦
            </div>
          )}
          {!selectedDoc && !selectedLoading && (
            <div className="text-xs text-slate-500">
              Select a COA from the table to see a quick summary: producer,
              retailers, potency & safety overview.
            </div>
          )}

          {selectedDoc && (
            <div className="flex flex-col gap-3 text-xs h-full">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-300">
                    #{selectedDoc.id} Â· {selectedDoc.fileName}
                  </div>
                  <div className="text-slate-500">
                    {new Date(selectedDoc.createdAt).toLocaleString()}
                    {selectedDoc.labResult
                      ? ` Â· LabResult #${selectedDoc.labResult.id}`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedDoc.verified}
                      onChange={(e) =>
                        setSelectedDoc({
                          ...selectedDoc,
                          verified: e.target.checked,
                        })
                      }
                      className="h-3 w-3 rounded border-slate-600 bg-slate-900"
                    />
                    Verified
                  </label>
                </div>
              </div>

              {/* Editable top metadata only */}
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300">Batch code</label>
                  <input
                    value={selectedDoc.batchCode || ''}
                    onChange={(e) =>
                      setSelectedDoc({
                        ...selectedDoc,
                        batchCode: e.target.value,
                      })
                    }
                    placeholder="Batch / Lot / METRC ID"
                    className="p-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300">Lab name</label>
                  <input
                    value={selectedDoc.labName || ''}
                    onChange={(e) =>
                      setSelectedDoc({
                        ...selectedDoc,
                        labName: e.target.value,
                      })
                    }
                    placeholder="Detected lab name"
                    className="p-1.5 rounded-md bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveSelected}
                  disabled={savingSelected}
                  className="px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-medium text-[11px] hover:bg-emerald-400 disabled:opacity-60"
                >
                  {savingSelected ? 'Savingâ€¦' : 'Save metadata'}
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-3 py-1.5 rounded-md border border-slate-700 text-[11px] text-slate-200"
                >
                  Close
                </button>
              </div>

              {/* Read-only summary */}
              <div className="border-t border-slate-800 pt-3 mt-1 space-y-2">
                <div>
                  <div className="text-slate-400 text-[11px]">
                    Producer / brand
                  </div>
                  <div className="text-slate-100">
                    {getProducerName(selectedDoc)}
                  </div>
                  <div className="text-slate-500">
                    {getProducerLocation(selectedDoc) ||
                      'No producer location recorded.'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] mb-0.5">
                    Retailers (where seen / sold)
                  </div>
                  {(() => {
                    const retailers = getRetailerList(selectedDoc);
                    if (!retailers.length) {
                      return (
                        <div className="text-slate-500">
                          No retailer locations linked to this batch yet.
                        </div>
                      );
                    }
                    return (
                      <ul className="text-slate-200 space-y-0.5">
                        {retailers.slice(0, 5).map((loc) => (
                          <li key={loc.id}>
                            {loc.name}
                            {loc.city || loc.state ? (
                              <span className="text-slate-500">
                                {' '}
                                Â· {loc.city || 'â€”'}, {loc.state || 'â€”'}
                              </span>
                            ) : null}
                          </li>
                        ))}
                        {retailers.length > 5 && (
                          <li className="text-slate-500">
                            + {retailers.length - 5} moreâ€¦
                          </li>
                        )}
                      </ul>
                    );
                  })()}
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] mb-0.5">
                    Potency (from linked lab result)
                  </div>
                  <div className="text-slate-100">
                    {getPotencySummary(selectedDoc)}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px] mb-0.5">
                    Safety / contaminants
                  </div>
                  <div className="text-slate-100">
                    {getSafetySummary(selectedDoc)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Detailed analyte-level data and raw text are available in
                    the Full debug view.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

