// src/app/regulator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import RegulatorShell from "./shell";

export const metadata = {
  title: "Regulator console · Smoke The Globe",
};

export default async function RegulatorLayout({ children }: { children: ReactNode }) {
  await requireRole(["regulator", "admin"]);
  return <RegulatorShell>{children}</RegulatorShell>;
}
