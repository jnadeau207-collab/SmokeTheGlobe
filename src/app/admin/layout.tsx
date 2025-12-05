// src/app/admin/layout.tsx
import { requireRole } from "@/lib/auth";
import type { ReactNode } from "react";
import AdminShell from "./shell";  // client shell for layout

export const metadata = { title: "Admin · SmokeTheGlobe" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Ensure user is admin (server-side check)
  await requireRole("admin");
  return <AdminShell>{children}</AdminShell>;
}
