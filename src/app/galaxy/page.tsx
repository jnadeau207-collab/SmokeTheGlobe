import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import GalaxyScene, { GalaxyLicense } from "@/components/galaxy/GalaxyScene";

export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  const licenses = await prisma.stateLicense.findMany({
    select: {
      id: true,
      entityName: true,
      stateCode: true,
      transparencyScore: true,
    },
    orderBy: { id: "asc" },
  });

  const licenseData: GalaxyLicense[] = licenses.map((l) => ({
    id: String(l.id),
    name: l.entityName ?? `License ${l.id}`,
    jurisdiction: l.stateCode ?? "",
    transparencyScore:
      typeof l.transparencyScore === "number" ? l.transparencyScore : 0,
  }));

  return (
    <div className="w-full h-screen">
      <Suspense fallback={<p className="p-4 text-sm text-gray-400">Loading 3D visualization...</p>}>
        <GalaxyScene licenses={licenseData} />
      </Suspense>
    </div>
  );
}
