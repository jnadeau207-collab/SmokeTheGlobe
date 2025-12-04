import { prisma } from "@/lib/prisma";
import LicenseAdminTable from "@/components/admin/LicenseAdminTable";

export default async function AdminLicensesPage() {
    // Fetch license data (all licenses with relevant fields)
    const licenses = await prisma.stateLicense.findMany({
        select: {
            licenseNumber: true,
            entityName: true,
            stateCode: true,
            status: true,
            transparencyScore: true,
        },
        orderBy: { licenseNumber: "asc" }
    });
    return <LicenseAdminTable licenses={licenses} />;
}
