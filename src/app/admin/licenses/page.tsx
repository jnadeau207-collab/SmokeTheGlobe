// src/app/admin/licenses/page.tsx
import { prisma } from "@/lib/prisma";
import LicenseAdminTable from "@/components/admin/LicenseAdminTable";

export const dynamic = "force-dynamic";

export default async function AdminLicensesPage() {
  const licenses = await prisma.stateLicense.findMany({
    select: {
      id: true,
      licenseNumber: true,
      entityName: true,
      stateCode: true,
      status: true,
      transparencyScore: true,
    },
    orderBy: {
      licenseNumber: "asc",
    },
  });

  const safeLicenses = licenses.map((l) => ({
    id: String(l.id),
    licenseNumber: l.licenseNumber ?? "",
    entityName: l.entityName ?? "",
    stateCode: l.stateCode ?? "",
    status: l.status ?? "",
    transparencyScore: l.transparencyScore ?? 0,
  }));

  return <LicenseAdminTable licenses={safeLicenses} />;
}
