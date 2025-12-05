import { requireRole } from "@/lib/auth";
import type { ReactNode } from "react";
export const metadata = { title: "Regulator Console · SmokeTheGlobe" };

export default async function RegulatorLayout({ children }: { children: React.ReactNode }) {
  // Allow regulator role (and admin)
  await requireRole(["regulator", "admin"]);
  return <div className="min-h-screen bg-slate-950 text-slate-50">{children}</div>;
}
