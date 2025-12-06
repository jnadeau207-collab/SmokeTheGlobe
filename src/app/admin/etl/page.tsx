// src/app/admin/etl/page.tsx
import { requireRole } from "@/lib/auth";
import EtlControlPanel from "@/components/admin/EtlControlPanel";

export const metadata = {
  title: "ETL Control Center · Smoke The Globe",
};

export default async function AdminEtlPage() {
  // Only admins can hit this route
  await requireRole("admin");

  return <EtlControlPanel />;
}
