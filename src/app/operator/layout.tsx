// src/app/operator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import OperatorNav from "@/components/operator/OperatorNav";
import OperatorSidebar from "@/components/operator/OperatorSidebar";

export const metadata = {
  title: "Operator suite · Smoke The Globe",
};

export default async function OperatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Admin can view everything; operator roles live here day to day.
  await requireRole(["admin", "operator", "producer", "retailer"], "/operator");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top pill navigation inside the suite (Overview / Licenses / etc.) */}
        <OperatorNav />

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px,1fr]">
          {/* Left: operator-specific side menu */}
          <OperatorSidebar />

          {/* Right: active page content */}
          <div className="min-h-[60vh] rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
