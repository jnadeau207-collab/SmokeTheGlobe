// src/app/(public)/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/50">
              <span className="text-sm font-bold text-emerald-300">SG</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-slate-50">
                Smoke The Globe
              </p>
              <p className="text-[11px] text-slate-400">
                Global cannabis transparency &amp; control room
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <Link href="/analytics" className="hover:text-emerald-300">
              Analytics Hub
            </Link>
            <Link href="/operator" className="hover:text-emerald-300">
              Operator Suite
            </Link>
            <Link href="/regulator" className="hover:text-emerald-300">
              Regulator Console
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
