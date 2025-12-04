// src/app/galaxy/page.tsx

import GalaxyScene, { GalaxyLicense } from "../../components/galaxy/GalaxyScene";
// lib/ is at the project root, so from src/app/galaxy we go up 3 levels
import { prisma } from "../../../lib/prisma";

// Always treat this route as dynamic so it sees fresh data
export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  // Only select fields that actually exist on StateLicense
  const licenses = await prisma.stateLicense.findMany({
    select: {
      id: true,
      entityName: true,
      stateCode: true,
      // transparencyScore is NOT selected here because it doesn't exist (yet) in the Prisma model
    },
  });

  const licenseData: GalaxyLicense[] = licenses.map((l) => ({
    id: String(l.id),
    name: l.entityName ?? String(l.id),
    jurisdiction: l.stateCode ?? "",
    // Use 0 for now; when you later add a real transparencyScore column,
    // you can wire it through here.
    transparencyScore: 0,
  }));

  return <GalaxyScene licenses={licenseData} />;
}
