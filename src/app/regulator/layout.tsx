// src/app/regulator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Regulator console · Smoke The Globe",
};

export default async function RegulatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("regulator", "/regulator");
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
