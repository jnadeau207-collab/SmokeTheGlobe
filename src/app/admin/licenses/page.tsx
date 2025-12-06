// src/app/admin/licenses/page.tsx
import { prisma } from "@/lib/prisma";
import LicenseAdminTable from "@/components/admin/LicenseAdminTable";

export default async function AdminLicensesPage() {
  // Fetch license data (id, name, status, etc.)
  const licenses = await prisma.stateLicense.findMany({
    select: {
      licenseNumber: true,
      entityName: true,
      stateCode: true,
      status: true,
      transparencyScore: true,
    },
  });
  // Render the client-side table component with this data
  return <LicenseAdminTable licenses={licenses} />;
}
