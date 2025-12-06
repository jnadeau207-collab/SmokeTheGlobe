// src/app/operator/licenses/[licenseId]/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import LicenseSuiteNav from "@/components/operator/LicenseSuiteNav";

export default async function LicenseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { licenseId: string };
}) {
  await requireRole(["admin", "operator", "producer", "retailer"], "/operator");

  const license = await prisma.stateLicense.findUnique({
    where: { id: params.licenseId },
    select: {
      id: true,
      licenseNumber: true,
      entityName: true,
    },
  });

  if (!license) {
    notFound();
  }

  return (
    <div className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-32 h-72 w-72 rounded-full bg-emerald-500/24 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-[-7rem] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative z-10 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/operator/licenses"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 hover:border-emerald-400/60 hover:text-emerald-100"
            >
              ← Back to licenses
            </Link>
            <h1 className="mt-3 text-xl font-semibold text-slate-50">
              {license.entityName}
            </h1>
            <p className="mt-1 text-[12px] text-slate-400">
              License:{" "}
              <code className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[11px]">
                {license.licenseNumber}
              </code>
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              This workspace is your full seed-to-sale suite for this license:
              rooms, plants, seeds, batches, packages, inventory, and COAs.
            </p>
          </div>
        </header>

        <LicenseSuiteNav licenseId={license.id} />

        <main className="mt-4">{children}</main>
      </div>
    </div>
  );
}
