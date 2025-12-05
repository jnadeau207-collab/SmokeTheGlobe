// src/app/operator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Operator suite · Smoke The Globe",
};

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  await requireRole(["operator", "producer", "retailer"]);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
