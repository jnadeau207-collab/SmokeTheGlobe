import GalaxyScene from "@/components/galaxy/GalaxyScene";
import { prisma } from "@/lib/prisma";

// Always treat this route as dynamic so it sees fresh data
export const dynamic = "force-dynamic";

type DbLicense = {
  id: number;
  entityName: string | null;
  licenseNumber: string | null;
  stateCode: string | null;
  transparencyScore: number | null;
};

export default async function GalaxyPage() {
  // Adjust this query if your model name / fields differ,
  // but `stateLicense` is the usual Prisma client name
  const licensesFromDb = (await prisma.stateLicense.findMany({
    select: {
      id: true,
      entityName: true,
      licenseNumber: true,
      stateCode: true,
      transparencyScore: true,
    },
  })) as DbLicense[];

  const licenses = licensesFromDb.map((l) => ({
    id: String(l.id),
    name: l.entityName || l.licenseNumber || `License ${l.id}`,
    jurisdiction: l.stateCode ?? "",
    transparencyScore: l.transparencyScore ?? 0,
  }));

  // If there are no licenses yet, still render a friendly empty state
  if (!licenses.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-100">
        <h1 className="text-2xl font-semibold mb-4">
          Supply Chain Galaxy
        </h1>
        <p className="text-sm text-gray-400">
          No license data found yet. Run the ETL to populate StateLicense
          records, then reload this page.
        </p>
      </div>
    );
  }

  return <GalaxyScene licenses={licenses} />;
}
