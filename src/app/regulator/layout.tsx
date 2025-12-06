// src/app/regulator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import RegulatorNav from "@/components/regulator/RegulatorNav";
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
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <RegulatorNav />

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px,1fr]">
          <RegulatorSidebar />
          <div className="min-h-[60vh] rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
