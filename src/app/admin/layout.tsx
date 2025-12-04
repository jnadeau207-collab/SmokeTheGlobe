"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionProvider, useSession, signOut } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin/licenses", label: "Licenses" },
  { href: "/admin/batches", label: "Batches" },
  { href: "/admin/lab-results", label: "Lab results" },
  { href: "/admin/uploads", label: "COA uploads" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/labs", label: "Labs" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/recalls", label: "Recalls" },
];

function AdminShell({ children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // If not logged in, bounce to NextAuth sign‑in
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin?callbackUrl=/admin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <p className="text-sm">Checking admin session…</p>
      </div>
    );
  }

  // If there is a session but no admin role, show a clear message
  const role = (session?.user as any)?.role;
  if (!session || role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="max-w-md rounded-2xl border border-amber-500/40 bg-slate-900/80 p-6 shadow-xl">
          <h1 className="mb-2 text-xl font-semibold">
            Admin access required
          </h1>
          <p className="text-sm text-slate-300">
            You’re signed in, but this account doesn’t have admin privileges.
            If this is unexpected, contact the Smoke&nbsp;The&nbsp;Globe
            team to grant the <code className="font-mono">admin</code> role.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-4 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-500 hover:text-emerald-400"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800/70 bg-slate-950/70 px-4 py-5 backdrop-blur">
        <div className="mb-6 space-y-1">
          <h1 className="text-sm font-semibold tracking-[0.18em] text-emerald-400">
            SMOKE THE GLOBE
          </h1>
          <p className="text-xs text-slate-400">Cannabis Data Command Center</p>
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center justify-between rounded-lg px-3 py-2 transition",
                  active
                    ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-50",
                ].join(" ")}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 text-xs text-slate-400">
          <div className="mb-3">
            <div className="font-medium text-slate-200">
              {(session.user as any)?.name ?? (session.user as any)?.email}
            </div>
            <div className="text-[0.7rem] uppercase tracking-[0.18em] text-emerald-400">
              ROLE: {String(role || "unknown").toUpperCase()}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg border border-slate-700 px-3 py-1.5 text-[0.7rem] text-slate-200 hover:border-emerald-500 hover:text-emerald-400"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <header className="border-b border-slate-800/70 bg-slate-950/60 px-8 py-4 backdrop-blur">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold">Admin Control</h2>
              <p className="text-xs text-slate-400">
                Secure oversight for licenses, transparency scoring, and
                compliance data.
              </p>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-6">{children}</section>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: Props) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
