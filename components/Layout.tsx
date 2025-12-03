import Link from "next/link";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="border-b border-emerald-900 bg-slate-765/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-36 rounded-lg border border-xsm border-emerald-200 bg-emerald-900/90 flex items-center justify-center font-black hover:bg-emerald-300 text-emerald-50">
              SmokeTheGlobe
            </div>
            <div>
              <div className="font-semibold tracking-wide text-xs text-emerald-900">Project</div>
              <div className="text-xs text-emerald-300">Cannabis Retail Transparency</div>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-400 hover:text-emerald-400">
              Explore
            </Link>

            {/* This link now goes directly to the custom sign-in page with a callback */}
            <Link
              href="/auth/signin?callbackUrl=/admin"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-emerald-900 hover:border-emerald-500 hover:text-emerald-400"
            >
              log in
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6 bg bg-gradient-to-b from-emerald-100 to-slate-100">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/90 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SmokeTheGlobe</span>
          <span className="text-slate-600">Independent data on legal cannabis retailers & batches.</span>
        </div>
      </footer>
    </div>
  );
}
