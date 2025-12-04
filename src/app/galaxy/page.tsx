import GalaxyScene from '@/components/galaxy/GalaxyScene';
import { prisma } from '@/lib/prisma';

// Make sure this route is always dynamic so it sees fresh data
export const dynamic = 'force-dynamic';

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
    id: l.id.toString(),
    name: l.entityName ?? l.id.toString(),
    jurisdiction: l.stateCode ?? '',
    transparencyScore: l.transparencyScore ?? 0,
  }));

  return <GalaxyScene licenses={licenseData} />;
}
