// src/app/(public)/page.tsx
import { prisma } from "@/lib/prisma";
import LandingClient from "@/components/public/LandingClient";

export const metadata = {
  title: "SmokeTheGlobe · Global Cannabis Transparency",
};

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const [licenseCount, batchCount, coaCount] = await Promise.all([
    prisma.stateLicense.count().catch(() => 0),
    prisma.batch.count().catch(() => 0),
    prisma.coaDocument.count().catch(() => 0),
  ]);

  return (
    <LandingClient
      initialLicenseCount={licenseCount}
      initialBatchCount={batchCount}
      initialCoaCount={coaCount}
    />
  );
}
