// src/app/galaxy/page.tsx
import dynamicImport from "next/dynamic";
import { prisma } from "@/lib/prisma";

// Always treat this route as dynamic so it sees fresh data
export const dynamic = "force-dynamic";

const GalaxyScene = dynamicImport(
  () => import("@/components/galaxy/GalaxyScene"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black">
        <p className="text-sm text-slate-400">
          Loading cannabis transparency galaxy…
        </p>
      </div>
    ),
  }
);

export default async function GalaxyPage() {
  const licenses = await prisma.stateLicense.findMany({
    select: {
      id: true,
      entityName: true,
      stateCode: true,
      transparencyScore: true,
    },
  });

  const normalized = licenses.map((l) => ({
    id: String(l.id),
    entityName: l.entityName ?? "",
    stateCode: l.stateCode ?? "",
    transparencyScore: l.transparencyScore ?? 0,
  }));

  return (
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),_transparent_55%)]" />

      <GalaxyScene licenses={normalized} />

      {/* Top gradient & HUD card */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
      <div className="pointer-events-none absolute bottom-6 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4">
        <div className="mx-auto rounded-3xl border border-emerald-400/20 bg-slate-950/60 px-4 py-3 text-center text-xs text-slate-300 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.35)]">
          <span className="font-semibold text-emerald-300">
            Cannabis Transparency Galaxy
          </span>{" "}
          · Each point is a license. Radius, color and glow encode regulatory
          transparency.
        </div>
      </div>
    </div>
  );
}
