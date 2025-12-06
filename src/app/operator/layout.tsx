// src/app/operator/layout.tsx
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import OperatorShell from "./shell";

export const metadata = {
  title: "Operator suite · Smoke The Globe",
};

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  await requireRole(["operator", "producer", "retailer", "admin"]);
  return <OperatorShell>{children}</OperatorShell>;
}

