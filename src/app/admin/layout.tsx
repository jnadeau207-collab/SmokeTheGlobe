// src/app/admin/layout.tsx

import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as (typeof session)["user"] & { role?: string } | undefined;

  if (!session || user?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      {/* Soft radial glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_55%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-6">
        {/* Top bar */}
        <header className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-[0.65rem] font-semibold tracking-[0.25em] text-emerald-300/80 uppercase"
          >
            Smoke The Globe · Admin
          </Link>

          <nav className="flex gap-3 text-xs text-slate-300">
            <Link
              href="/admin/uploads"
              className="rounded-full bg-slate-900/60 px-3 py-1 backdrop-blur-md border border-slate-800 hover:border-emerald-400/60 hover:bg-slate-900/80 transition"
            >
              Uploads
            </Link>
            <Link
              href="/admin/licenses"
              className="rounded-full bg-slate-900/60 px-3 py-1 backdrop-blur-md border border-slate-800 hover:border-sky-400/60 hover:bg-slate-900/80 transition"
            >
              Licenses
            </Link>
            <Link
              href="/galaxy"
              className="rounded-full bg-slate-900/60 px-3 py-1 backdrop-blur-md border border-slate-800 hover:border-fuchsia-400/60 hover:bg-slate-900/80 transition"
            >
              Galaxy
            </Link>
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
