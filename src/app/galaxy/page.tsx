// src/app/galaxy/page.tsx

import GalaxyScene, {
  type GalaxyLicense,
} from "@/components/galaxy/GalaxyScene";
import { prisma } from "@/lib/prisma";

// Always treat this route as dynamic so it sees fresh data
export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  let licenses: GalaxyLicense[] = [];

  try {
    // Only select fields that actually exist on StateLicense
    const rows = await prisma.stateLicense.findMany({
      select: {
        id: true,
        entityName: true,
        stateCode: true,
      },
      take: 1000,
    });

    licenses = rows.map((row) => ({
      id: String(row.id),
      name: row.entityName ?? `License #${row.id}`,
      jurisdiction: row.stateCode ?? undefined,
      // We don't have transparencyScore in Prisma yet, so stub to 0
      transparencyScore: 0,
    }));
  } catch (err) {
    console.error("[/galaxy] Failed to load licenses", err);
    // Fall back to an empty galaxy instead of crashing
    licenses = [];
  }

  return <GalaxyScene licenses={licenses} />;
}
