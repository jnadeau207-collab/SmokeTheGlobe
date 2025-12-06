// src/app/regulator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import RegulatorSidebar from "@/components/regulator/RegulatorSidebar";

export const metadata = {
  title: "Regulator console · Smoke The Globe",
};

export default async function RegulatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["admin", "regulator"], "/regulator");

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Left rail */}
      <div className="hidden w-64 lg:block">
        <RegulatorSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-sky-300/80">
              Regulator console
            </p>
            <h1 className="mt-1 text-xl font-semibold">Regulatory overview</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitor licenses, COAs, recalls, and market signals for your
              jurisdiction. Admins see all data; regulators see only the
              regions they’re assigned.
            </p>
          </header>

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
