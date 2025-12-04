import {{ prisma }} from "@/lib/prisma";
import LicenseAdminTable from "@/components/admin/LicenseAdminTable";

export default async function AdminLicensesPage() {{
  // Fetch license data from database (transparencyScore included)
  const licenses = await prisma.stateLicense.findMany({{
    select: {{
      licenseNumber: true,
      entityName: true,
      stateCode: true,
      status: true,
      transparencyScore: true,
    }},
    orderBy: {{ licenseNumber: 'asc' }}  // initial sort by license number
  }});
  
  return <LicenseAdminTable licenses={{licenses}} />;
}}
