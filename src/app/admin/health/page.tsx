// src/app/admin/health/page.tsx
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "System Health · Smoke The Globe",
};

export const dynamic = "force-dynamic";

async function getDbHealth() {
  try {
    // Basic connectivity check
    const now = await prisma.$queryRawUnsafe<{ now: Date }[]>(
      "SELECT NOW() as now"
    );

    // Try to read high-value tables; if a table is missing, we swallow that into the status.
    const [licenseCount, batchCount, labResultCount] = await Promise.all([
      prisma.stateLicense
        .count()
        .catch(() => null as number | null),
      prisma.batch.count().catch(() => null as number | null),
      prisma.labResult.count().catch(() => null as number | null),
    ]);

    return {
      status: "ok" as const,
      now: now?.[0]?.now ?? null,
      licenseCount,
      batchCount,
      labResultCount,
    };
  } catch (error: any) {
    console.error("DB health check failed", error);
    return {
      status: "error" as const,
      errorMessage:
        error?.message ??
        "Unknown error while connecting to the smoketheglobe database.",
    };
  }
}

export default async function AdminHealthPage() {
  const health = await getDbHealth();

  const statusColor =
    health.status === "ok"
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/40"
      : "text-rose-300 bg-rose-500/10 border-rose-500/40";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Ambient background textures */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-10rem] h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-[-8rem] h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.16),transparent_60%)] mix-blend-soft-light" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
              System health
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Database & telemetry
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Live view into the smoketheglobe Postgres instance powering
              licenses, batches, and lab results. Everything here is read-only
              and safe for production.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusColor}`}
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-current" />
            <span>
              {health.status === "ok" ? "Database online" : "Database error"}
            </span>
          </div>
        </header>

        {/* Grid of cards */}
        <main className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
          {/* Left: metrics & details */}
          <section className="space-y-5 rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-5 shadow-[0_0_60px_rgba(16,185,129,0.25)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-emerald-50">
                Core tables
              </h2>
              {health.status === "ok" && health.now && (
                <p className="text-[11px] text-emerald-200/80">
                  Last checked:{" "}
                  {new Date(health.now).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>

            {health.status === "error" ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                <p className="font-semibold mb-1">Database connection error</p>
                <p className="text-[13px] text-rose-100/80">
                  {health.errorMessage}
                </p>
                <p className="mt-2 text-[11px] text-rose-100/70">
                  Check that the Postgres container is running,{" "}
                  <code className="rounded bg-slate-900 px-1 py-[1px]">
                    DATABASE_URL
                  </code>{" "}
                  is correct, and migrations have been applied.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/60 via-slate-950 to-slate-950 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">
                    Licenses
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {health.licenseCount ?? "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-100/70">
                    Records in <code>StateLicense</code>
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-900/60 via-slate-950 to-slate-950 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-sky-300/80">
                    Batches
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {health.batchCount ?? "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-sky-100/70">
                    Records in <code>Batch</code>
                  </p>
                </div>

                <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-900/60 via-slate-950 to-slate-950 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-fuchsia-300/80">
                    Lab results
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {health.labResultCount ?? "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-fuchsia-100/70">
                    Records in <code>LabResult</code>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Right: status narrative */}
          <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-slate-50">
              Ops notes & checks
            </h2>
            <ul className="space-y-3 text-[12px] text-slate-300">
              <li className="flex gap-2">
                <span className="mt-[3px] inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  This page performs a live query against the{" "}
                  <code>smoketheglobe</code> Postgres instance and key tables,
                  without mutating any data.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>
                  If counts show as <code>—</code>, the table may not exist yet
                  or migrations have not been fully applied.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>
                  For deeper inspection, log into Adminer at{" "}
                  <code>http://localhost:8080</code> using the{" "}
                  <span className="font-mono">postgres/postgres</span>{" "}
                  credentials configured in Docker.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>
                  If this page shows a database error, check Docker logs for{" "}
                  <code>smoketheglobe-db-1</code> and verify{" "}
                  <code>DATABASE_URL</code> in your <code>.env</code> file.
                </span>
              </li>
            </ul>
          </aside>
        </main>
      </div>
    </div>
  );
}
Supabase / DB (already added earlier)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/smoketheglobe?schema=public"
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/smoketheglobe?schema=public"
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:5432/smoketheglobe?schema=public"
POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/smoketheglobe?schema=public"

# NextAuth
NEXTAUTH_SECRET=oh4sBwQ3caSIV9ScALvdphzIqrkCfEIZh6+1D5ZBVnlN+KbVdSdLqHHwd1s=

# Bootstrap admin credentials (development only)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Somestrongdevpassword123!



# ETL integration settings
OPENAI_API_KEY=

ETL_ENABLE_CA=0  # Set to 1 to enable ETL for California
ETL_ENABLE_WA=0  # Set to 1 to enable ETL for Washington
ETL_ENABLE_DE=0  # Or ON/other region if you later change the pipeline


SUPABASE_URL=

SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=

ETL_ENABLE_CA=0 # Set to 1 to enable ETL for California.

ETL_ENABLE_WA=0 # Set to 1 to enable ETL for Washington.

ETL_ENABLE_ON=0 # Set to 1 to enable ETL for Ontario.
