// src/app/admin/layout.tsx
import "./admin.css"; // optional if you want a separate CSS; or remove this line
import { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import SignOutButton from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/"); // or redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-50">
      {/* Soft glow background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.20),_transparent_55%)]" />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-slate-800/70 bg-slate-950/60 backdrop-blur-xl shadow-lg shadow-emerald-500/10 md:flex">
          <div className="px-5 pb-4 pt-5 border-b border-slate-800/70">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-emerald-400">
              Admin
            </div>
            <div className="mt-2 text-sm font-medium text-slate-50">
              Cannabis Suite
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Internal tools for license & batch transparency.
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
            <SectionLabel>Overview</SectionLabel>
            <NavItem href="/admin" label="Dashboard" />

            <SectionLabel>Data</SectionLabel>
            <NavItem href="/admin/licenses" label="Licenses" />
            <NavItem href="/admin/uploads" label="COA Uploads" />
            {/* Keep existing links here, e.g. batches, etc. */}
            {/* <NavItem href="/admin/batches" label="Batches" /> */}

            <SectionLabel>Exploration</SectionLabel>
            <NavItem href="/galaxy" label="Galaxy View" />
          </nav>

          <div className="border-t border-slate-800/70 px-4 py-3 text-xs text-slate-400">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium text-slate-100 truncate">
                  {session.user?.email ?? "admin"}
                </span>
                <span className="text-[0.65rem] uppercase tracking-wide text-emerald-400">
                  {(session.user as any)?.role ?? "admin"}
                </span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Mobile top nav */}
          <div className="flex items-center justify-between border-b border-slate-800/70 bg-slate-950/80 px-4 py-3 backdrop-blur-xl md:hidden">
            <div>
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-400">
                Admin
              </div>
              <div className="text-sm font-medium text-slate-50">
                Cannabis Suite
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/admin"
                className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-slate-200 hover:border-emerald-500/80 hover:text-emerald-300"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/licenses"
                className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-slate-200 hover:border-emerald-500/80 hover:text-emerald-300"
              >
                Licenses
              </Link>
            </div>
          </div>

          <div className="relative px-4 pb-8 pt-4 md:px-6 md:pt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-500">
      {children}
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900/80 hover:text-emerald-300"
    >
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
