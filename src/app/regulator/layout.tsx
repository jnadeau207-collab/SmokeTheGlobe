// src/app/regulator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import RegulatorNav from "@/components/regulator/RegulatorNav";
import OperatorSidebar from "@/components/operator/OperatorSidebar";

export const metadata = {
  title: "Regulator console · Smoke The Globe",
};

export default async function RegulatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Regulator + admin can view this console.
  await requireRole(["admin", "regulator"], "/regulator");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <RegulatorNav />
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px,1fr]">
          <div className="lg:block">
            {/* Global, role-aware sidebar */}
            <OperatorSidebar />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
