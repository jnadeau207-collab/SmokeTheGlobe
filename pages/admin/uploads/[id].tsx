import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type LabResult = {
  id: number;
  batchId?: number | null;
  thcPercent?: number | null;
  cbdPercent?: number | null;
  totalCannabinoidsPercent?: number | null;
  passed?: boolean | null;
  createdAt: string;
};

type UploadedDocumentDetail = {
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
  filePath?: string | null;
  labResult?: LabResult | null;
};

export default function AdminUploadFullDebug() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [doc, setDoc] = useState<UploadedDocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !session) return;
    const idStr = Array.isArray(id) ? id[0] : id;
    void fetchDoc(idStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session]);

  async function fetchDoc(idStr: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/uploads/${idStr}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to load document');
      }
      const data = await res.json();
      setDoc(data);
    } catch (e: any) {
      console.error('Failed to load upload detail', e);
      setError(e.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">
          Sign in as an admin to view COA debug details.
        </p>
      </div>
    );
  }

  if (loading && !doc) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-300">Loading COA…</p>
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push('/admin/uploads')}
          className="text-xs text-slate-400 hover:text-emerald-400 mb-2"
        >
          ← Back to COA uploads
        </button>
        <p className="text-sm text-slate-300">Document not found.</p>
      </div>
    );
  }

  const sizeKb = (doc.size / 1024).toFixed(1);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* Top bar / breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            onClick={() => router.push('/admin/uploads')}
            className="text-xs text-slate-400 hover:text-emerald-400 mb-1"
          >
            ← Back to COA uploads
          </button>
          <h1 className="text-2xl font-semibold text-slate-100">
            COA #{doc.id}
          </h1>
          <p className="text-sm text-slate-400">
            {doc.fileName}{' '}
            <span className="text-slate-600">
              ({sizeKb} KB · {doc.mimeType})
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] text-slate-500 font-mono break-all">
            SHA256: {doc.sha256}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-[11px] border ${
              doc.verified
                ? 'border-emerald-500 text-emerald-300'
                : 'border-slate-600 text-slate-300'
            }`}
          >
            {doc.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
      </div>

      {/* Main grid: left metadata, right raw text */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)]">
        {/* Metadata / parsed view */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              Parsed metadata
            </h2>
            <div className="grid gap-2 text-xs">
              <div>
                <div className="text-slate-400">Batch code</div>
                <div className="text-slate-100">
                  {doc.batchCode || (
                    <span className="text-slate-500">Not detected</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Lab name</div>
                <div className="text-slate-100">
                  {doc.labName || (
                    <span className="text-slate-500">Not detected</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Uploaded</div>
                <div className="text-slate-100">
                  {new Date(doc.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-400">File path (backend)</div>
                <div className="text-[11px] text-slate-500 break-all">
                  {doc.filePath || 'Not stored on disk (in-memory upload)'}
                </div>
              </div>
            </div>
          </div>

          {/* LabResult summary if present */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              Linked lab result
            </h2>
            {!doc.labResult ? (
              <div className="text-xs text-slate-500">
                No LabResult record linked to this COA yet.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-slate-200">
                    LabResult #{doc.labResult.id}
                  </div>
                  <div className="text-slate-500">
                    {new Date(doc.labResult.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="grid gap-2 grid-cols-2">
                  <div>
                    <div className="text-slate-400">THC %</div>
                    <div className="text-slate-100">
                      {doc.labResult.thcPercent != null
                        ? `${doc.labResult.thcPercent.toFixed(2)}%`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">CBD %</div>
                    <div className="text-slate-100">
                      {doc.labResult.cbdPercent != null
                        ? `${doc.labResult.cbdPercent.toFixed(2)}%`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Total cannabinoids %</div>
                    <div className="text-slate-100">
                      {doc.labResult.totalCannabinoidsPercent != null
                        ? `${doc.labResult.totalCannabinoidsPercent.toFixed(2)}%`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Overall result</div>
                    <div className="text-slate-100">
                      {doc.labResult.passed == null
                        ? 'Unknown'
                        : doc.labResult.passed
                          ? 'Pass'
                          : 'Fail'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Batch link:{' '}
                  {doc.labResult.batchId
                    ? `Batch #${doc.labResult.batchId}`
                    : 'not linked'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Raw extracted text */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-200">
              Raw extracted text
            </h2>
            <span className="text-[11px] text-slate-500">
              Use this to refine per-lab parsing rules.
            </span>
          </div>
          <div className="flex-1 rounded-md border border-slate-800 bg-slate-950 text-[11px] text-slate-200 p-3 overflow-auto whitespace-pre-wrap">
            {doc.extractedText
              ? doc.extractedText
              : 'No extracted text stored for this COA.'}
          </div>
        </div>
      </div>
    </div>
  );
}
