// src/app/galaxy/page.tsx
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export type GalaxyLicense = {
  id: string;
  entityName: string | null;
  stateCode: string | null;
  transparencyScore: number | null;
};

const GalaxyScene = dynamic(
  () => import("@/components/galaxy/GalaxyScene"),
  {
    ssr: false,
  }
);

async function getLicenses(): Promise<GalaxyLicense[]> {
  const rows = await prisma.stateLicense.findMany({
    select: {
      id: true,
      entityName: true,
      stateCode: true,
      transparencyScore: true
    },
    take: 5000 // cap for performance; adjust as needed
  });

  return rows.map((row) => ({
    id: String(row.id),
    entityName: row.entityName,
    stateCode: row.stateCode,
    transparencyScore: row.transparencyScore
  }));
}

export default async function GalaxyPage() {
  const licenses = await getLicenses();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-50">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div>
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Compliance Galaxy
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Internal 3D view of licenses and transparency scores. For admin use only.
          </p>
        </div>
      </header>

      <main className="relative z-0 h-[calc(100vh-4rem)]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Initializing galaxy…
            </div>
          }
        >
          <GalaxyScene licenses={licenses} />
        </Suspense>
      </main>
    </div>
  );
}
