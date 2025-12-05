import { requireRole } from "@/lib/auth";
import type { ReactNode } from "react";
export const metadata = { title: "Analytics Lab · SmokeTheGlobe" };

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  // Allow analysts and admins
  await requireRole(["analyst", "admin"]);
  return <div className="min-h-screen bg-slate-950 text-slate-50">{children}</div>;
}
