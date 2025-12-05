// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import AdminShell from "./shell";

export const metadata = {
  title: "Admin · Smoke The Globe",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // After login, bring the user back to /admin.
  await requireRole("admin", "/admin");
  return <AdminShell>{children}</AdminShell>;
}
