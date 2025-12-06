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
  // Allow admin to inspect operator suite as superuser.
  await requireRole(["admin", "operator", "producer", "retailer"], "/operator");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <OperatorNav />
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px,1fr]">
          <div className="lg:block">
            <OperatorSidebar />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
