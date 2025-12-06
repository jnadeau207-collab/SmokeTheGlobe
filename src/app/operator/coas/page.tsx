// src/app/operator/coas/page.tsx
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Operator COAs · Smoke The Globe",
};

export const dynamic = "force-dynamic";

export default async function OperatorCoasPage() {
  const documents = await prisma.coaDocument
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-4rem] bottom-[-6rem] h-64 w-64 rounded-full bg-emerald-500/16 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative z-10 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Certificates of Analysis</h1>
            <p className="mt-1 text-[12px] text-slate-400">
              COA documents captured via admin uploads or ETL. This view
              surfaces COA metadata and status, without exposing any private
              data beyond what you choose to ingest.
            </p>
          </div>
          <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
            {documents.length} COAs in view
          </div>
        </header>

        <div className="mt-2 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-[12px] text-slate-400">
              No COA documents have been ingested yet. Upload via the admin
              COA pipeline or enable ETL sources to see them here.
            </div>
          ) : (
            documents.map((doc) => (
              <article
                key={doc.id}
                className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[13px] font-semibold text-slate-50">
                      {doc.title}
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {doc.labName || "Lab unknown"}
                      {doc.batchRef && (
                        <>
                          {" · "}
                          <span className="text-slate-100">
                            Batch: {doc.batchRef}
                          </span>
                        </>
                      )}
                      {doc.licenseRef && (
                        <>
                          {" · "}
                          <span className="text-slate-100">
                            License: {doc.licenseRef}
                          </span>
                        </>
                      )}
                    </p>
                    {doc.storageKey && (
                      <p className="mt-1 text-[10px] text-slate-500">
                        File key:{" "}
                        <code className="break-all">{doc.storageKey}</code>
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
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
