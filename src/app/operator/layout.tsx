import { requireRole } from "@/lib/auth";
export const metadata = { title: "Operator Suite · SmokeTheGlobe" };

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  // Allow roles: operator, producer, retailer (and admin by default, since admin can see all)
  await requireRole(["operator", "producer", "retailer", "admin"]);
  return <div className="min-h-screen bg-slate-950 text-slate-50">{children}</div>;
}
