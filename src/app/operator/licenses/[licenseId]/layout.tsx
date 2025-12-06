// src/app/operator/licenses/[licenseId]/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LicenseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ licenseId: string }>;
}) {
  // Admin + operator roles can view license workspaces.
  await requireRole(["admin", "operator", "producer", "retailer"], "/operator");

  // Next 16: params is a Promise now, so we must await it.
  const { licenseId } = await params;

  const id = Number(licenseId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const license = await prisma.stateLicense.findUnique({
    where: { id },
    select: {
      id: true,
      licenseNumber: true,
      entityName: true,
      stateCode: true,
      licenseType: true,
      status: true,
    },
  });

  if (!license) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-300/80">
            License workspace
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-50">
            {license.entityName}
          </h1>
          <p className="mt-1 text-[12px] text-slate-400">
            #{license.licenseNumber} · {license.stateCode || "NA"} ·{" "}
            {license.licenseType || "Unknown"} ·{" "}
            <span className="text-emerald-200">
              {license.status || "Unknown"}
            </span>
          </p>
        </div>
        <Link
          href="/operator/licenses"
          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 hover:border-emerald-400/60 hover:text-emerald-100"
        >
          ← Back to licenses
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
        {children}
      </div>
    </div>
  );
}
