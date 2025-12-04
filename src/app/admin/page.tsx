// src/app/admin/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/authOptions";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as (typeof session)["user"] & { role?: string } | undefined;

  if (!session || user?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),_transparent_55%)]" />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col gap-6 px-4 py-10">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.25em] text-emerald-300/80 uppercase">
              Admin Control
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              Cannabis Data Command Center
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Secure oversight for licenses, transparency scoring, and compliance data. Internal use only.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200 backdrop-blur-xl">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
              <span>Role: admin</span>
            </div>
            <SignOutButton />
          </div>
        </header>

        {/* Tiles */}
        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/uploads"
            className="group rounded-3xl border border-slate-800/80 bg-slate-950/50 p-4 shadow-[0_0_40px_rgba(15,23,42,0.8)] backdrop-blur-xl transition hover:border-emerald-400/60 hover:shadow-[0_0_45px_rgba(45,212,191,0.55)]"
          >
            <div className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-emerald-300/90 uppercase">
              Documents
            </div>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-50">COA Uploads</h2>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[0.65rem] text-emerald-200">
                Batch data
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ingest Certificates of Analysis and power the transparency scoring engine.
            </p>
          </Link>

          <Link
            href="/admin/licenses"
            className="group rounded-3xl border border-slate-800/80 bg-slate-950/50 p-4 shadow-[0_0_40px_rgba(15,23,42,0.8)] backdrop-blur-xl transition hover:border-sky-400/60 hover:shadow-[0_0_45px_rgba(56,189,248,0.55)]"
          >
            <div className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-sky-300/90 uppercase">
              Registry
            </div>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-50">Licenses</h2>
              <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[0.65rem] text-sky-200">
                Read only
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Review operators, jurisdictions, and transparency scores in a searchable grid.
            </p>
          </Link>

          <Link
            href="/galaxy"
            className="group rounded-3xl border border-slate-800/80 bg-slate-950/50 p-4 shadow-[0_0_40px_rgba(15,23,42,0.8)] backdrop-blur-xl transition hover:border-fuchsia-400/60 hover:shadow-[0_0_45px_rgba(232,121,249,0.5)]"
          >
            <div className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-fuchsia-300/90 uppercase">
              Visualization
            </div>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-50">Transparency Galaxy</h2>
              <span className="rounded-full bg-fuchsia-400/15 px-2 py-0.5 text-[0.65rem] text-fuchsia-200">
                3D view
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Explore the network of operators as an interactive 3D galaxy.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}
