// src/components/admin/CoaUploadClient.tsx
"use client";

import { useState, useTransition, FormEvent, ChangeEvent } from "react";

type CoaDocument = {
  id: string;
  title: string;
  labName: string | null;
  batchRef: string | null;
  licenseRef: string | null;
  status: string;
  rawText: string | null;
  fileType: string | null;
  storageKey: string | null;
  sourceType: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export default function CoaUploadClient({
  initialDocuments,
}: {
  initialDocuments: CoaDocument[];
}) {
  const [documents, setDocuments] = useState<CoaDocument[]>(initialDocuments);

  const [title, setTitle] = useState("");
  const [labName, setLabName] = useState("");
  const [batchRef, setBatchRef] = useState("");
  const [licenseRef, setLicenseRef] = useState("");

  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUploadInProgress, setFileUploadInProgress] = useState(false);
  const [uploadedStorageKey, setUploadedStorageKey] = useState<string | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle("");
    setLabName("");
    setBatchRef("");
    setLicenseRef("");
    setRawText("");
    setFile(null);
    setUploadedStorageKey(null);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);
    setUploadedStorageKey(null);

    const files = e.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      return;
    }

    const selected = files[0];
    setFile(selected);
  }

  async function uploadFileIfNeeded(): Promise<{
    storageKey: string | null;
    fileType: string | null;
  }> {
    if (!file) {
      return { storageKey: uploadedStorageKey, fileType: null };
    }

    setFileUploadInProgress(true);
    try {
      const presignRes = await fetch("/api/admin/uploads/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to obtain an upload URL for this file."
        );
      }

      const { uploadUrl, storageKey } = (await presignRes.json()) as {
        uploadUrl: string;
        storageKey: string;
      };

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload file to object storage.");
      }

      setUploadedStorageKey(storageKey);
      return { storageKey, fileType: file.type || "application/octet-stream" };
    } finally {
      setFileUploadInProgress(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!rawText.trim() && !file) {
      setError("Provide either COA text or a file (PDF/image/etc.).");
      return;
    }

    startTransition(async () => {
      try {
        const { storageKey, fileType } = await uploadFileIfNeeded();

        const res = await fetch("/api/admin/uploads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            labName: labName.trim() || undefined,
            batchRef: batchRef.trim() || undefined,
            licenseRef: licenseRef.trim() || undefined,
            rawText: rawText.trim() || undefined,
            fileType: storageKey ? fileType : undefined,
            storageKey: storageKey ?? undefined,
            sourceType: storageKey ? "operator-upload" : "manual",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create COA document.");
        }

        const data = (await res.json()) as { document: CoaDocument };
        setDocuments((prev) => [data.document, ...prev]);
        setSuccess("COA registered successfully.");
        resetForm();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unexpected error while saving COA.");
      }
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Ambient background textures */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-10rem] h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-[-8rem] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_60%)] mix-blend-soft-light" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
              COA pipeline
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Certificate of Analysis intake
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Capture COAs via text or file uploads, associate them with batches
              and licenses, and track parsing status. Files are stored in
              object storage; only metadata and parsed fields live in the
              database.
            </p>
          </div>
          <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            Seed-to-sale data intake
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.1fr_1.1fr]">
          {/* Left: COA capture form */}
          <section className="space-y-4 rounded-3xl border border-emerald-500/30 bg-slate-950/90 p-5 shadow-[0_0_60px_rgba(16,185,129,0.25)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-emerald-50">
                Capture COA
              </h2>
              {(isPending || fileUploadInProgress) && (
                <span className="text-[11px] text-emerald-300">
                  {fileUploadInProgress ? "Uploading file…" : "Saving…"}
                </span>
              )}
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                    placeholder="Strain name, lot, or COA identifier"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Lab name (optional)
                  </label>
                  <input
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                    placeholder="e.g. Emerald Analytics"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Batch reference (optional)
                  </label>
                  <input
                    value={batchRef}
                    onChange={(e) => setBatchRef(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                    placeholder="internal or regulatory batch ID"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    License reference (optional)
                  </label>
                  <input
                    value={licenseRef}
                    onChange={(e) => setLicenseRef(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                    placeholder="license number or entity"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  COA text (optional)
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="h-36 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                  placeholder="Paste COA text here, or leave blank if you are uploading a file instead."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  COA file (PDF/image, optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="text-[11px] text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-950 hover:file:bg-emerald-400"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  If you provide both text and a file, the file is stored and
                  text is used as the initial parsed version.
                </p>
              </div>

              {error && (
                <p className="text-[11px] text-rose-300">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-[11px] text-emerald-300">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending || fileUploadInProgress}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/60 bg-emerald-500/90 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Register COA
              </button>
            </form>
          </section>

          {/* Right: COA list */}
          <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-50">
                Recent COAs
              </h2>
              <p className="text-[11px] text-slate-400">
                {documents.length === 0
                  ? "No COAs captured yet."
                  : `${documents.length} stored in database.`}
              </p>
            </div>

            <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {documents.length === 0 ? (
                <p className="text-[12px] text-slate-500">
                  Once you register COAs, they will appear here with their
                  status and file/text metadata.
                </p>
              ) : (
                documents.map((doc) => {
                  const created =
                    typeof doc.createdAt === "string"
                      ? new Date(doc.createdAt)
                      : doc.createdAt;
                  return (
                    <article
                      key={doc.id}
                      className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[13px] font-semibold text-slate-50">
                            {doc.title}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {doc.labName || "Lab unknown"}
                            {doc.batchRef && (
                              <>
                                {" · "}
                                <span className="text-slate-300">
                                  Batch: {doc.batchRef}
                                </span>
                              </>
                            )}
                            {doc.licenseRef && (
                              <>
                                {" · "}
                                <span className="text-slate-300">
                                  License: {doc.licenseRef}
                                </span>
                              </>
                            )}
                          </p>
                          {doc.storageKey && (
                            <p className="mt-1 text-[10px] text-slate-500">
                              File stored at:{" "}
                              <code className="break-all">
                                {doc.storageKey}
                              </code>
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full border px-2 py-[2px] text-[10px] font-medium uppercase tracking-wide ${
                            doc.status === "parsed"
                              ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                              : doc.status === "failed"
                              ? "border-rose-400/50 bg-rose-500/10 text-rose-200"
                              : "border-sky-400/40 bg-sky-500/10 text-sky-200"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      {doc.rawText && (
                        <p className="mt-2 line-clamp-2 text-[11px] text-slate-400">
                          {doc.rawText}
                        </p>
                      )}
                      <p className="mt-2 text-[10px] text-slate-500">
                        Captured{" "}
                        {created.toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
