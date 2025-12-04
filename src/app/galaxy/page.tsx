// src/app/galaxy/page.tsx

import GalaxyScene from "@/components/galaxy/GalaxyScene";
import { prisma } from "@/lib/prisma";

// Always treat this route as dynamic so it sees fresh data
export const dynamic = "force-dynamic";

type LicenseNode = {
  id: string;
  name: string;
  jurisdiction: string;
  transparencyScore: number;
};

async function getLicenseNodes(): Promise<LicenseNode[]> {
  try {
    const licenses = await prisma.stateLicense.findMany({
      // Only select fields that we know exist on StateLicense
      select: {
        id: true,
        entityName: true,
        stateCode: true,
        // you can add more real columns later if needed
      },
    });

    return licenses.map((l) => ({
      id: l.id.toString(),
      name: l.entityName ?? `License ${l.id}`,
      jurisdiction: l.stateCode ?? "",
      // We don't have a transparencyScore column yet, so just default to 0 for now
      transparencyScore: 0,
    }));
  } catch (error) {
    console.error("[GALAXY] Failed to load licenses from DB, using demo data instead:", error);

    // Fallback demo data so the galaxy still renders
    return [
      {
        id: "demo-1",
        name: "Demo License A",
        jurisdiction: "CA",
        transparencyScore: 0.7,
      },
      {
        id: "demo-2",
        name: "Demo License B",
        jurisdiction: "WA",
        transparencyScore: 0.4,
      },
      {
        id: "demo-3",
        name: "Demo License C",
        jurisdiction: "ON",
        transparencyScore: 0.9,
      },
    ];
  }
}

export default async function GalaxyPage() {
  const nodes = await getLicenseNodes();

  return (
    <main className="min-h-screen bg-black text-white">
      <h1 className="text-2xl font-bold p-4">Supply Chain Galaxy</h1>
      <GalaxyScene licenses={nodes} />
    </main>
  );
}
