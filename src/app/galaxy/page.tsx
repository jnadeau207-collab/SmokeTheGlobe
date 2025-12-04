import GalaxyScene from "../../components/galaxy/GalaxyScene";
import { prisma } from "../../lib/prisma";

// Make sure this route is always dynamic so it sees fresh data
export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  const licenses = await prisma.stateLicense.findMany({
    select: {
      id: true,
      entityName: true,
      stateCode: true,
      transparencyScore: true,
    },
  });

  const licenseData = licenses.map((l) => ({
    id: String(l.id),
    name: l.entityName || String(l.id),
    jurisdiction: l.stateCode ?? "",
    transparencyScore: l.transparencyScore ?? 0,
  }));

  return (
    <main
      style={{
        height: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        background: "#000",
      }}
    >
      <GalaxyScene licenses={licenseData} />
    </main>
  );
}
