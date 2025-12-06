// src/app/operator/batches/page.tsx
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Operator batches · Smoke The Globe",
};

export const dynamic = "force-dynamic";

export default async function OperatorBatchesPage() {
  const [batchCount, batches] = await Promise.all([
    prisma.batch.count().catch(() => 0),
    prisma.batch
      .findMany({
        take: 25,
      })
      .catch(() => [] as any[]),
  ]);

  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute right-[-4rem] bottom-[-6rem] h-64 w-64 rounded-full bg-emerald-500/16 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative z-10 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Batches</h1>
            <p className="mt-1 text-[12px] text-slate-400">
              Production lots flowing through your seed-to-sale system. This
              view will eventually link to COAs, inventory, and sales once ETL
              and mutations are wired.
            </p>
          </div>
          <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
            {batchCount} total batches
          </div>
        </header>

        <div className="mt-2 max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/80">
          {batches.length === 0 ? (
            <div className="p-6 text-[12px] text-slate-400">
              No batch records yet. Once ETL or operator-side creation is live,
              this table will fill in automatically.
            </div>
          ) : (
            <table className="min-w-full border-collapse text-left text-[12px]">
              <thead className="sticky top-0 bg-slate-950/95">
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-2 font-medium text-slate-400">
                    Internal ID
                  </th>
                  <th className="px-4 py-2 font-medium text-slate-400">
                    Raw payload snapshot
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b: any) => (
                  <tr
                    key={b.id}
                    className="border-b border-slate-800/80 align-top hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-2 text-slate-100">
                      <code className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[11px]">
                        {String(b.id)}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-slate-300">
                      <pre className="max-h-24 overflow-hidden whitespace-pre-wrap rounded bg-slate-900/70 p-2">
                        {JSON.stringify(b, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
