# Step 8 Implementation Script - PowerShell 7
# This script will create/update the admin layout, admin licenses page, LicenseAdminTable component,
# and add a placeholder GalaxyScene component if not present.

Write-Host "=== Step 8: Implement Admin Licenses Page with Enhanced Styling ==="

# 1. Ensure directory structure exists
$adminAppDir = "src/app/admin"
$adminLicensesDir = "src/app/admin/licenses"
$adminCompDir = "src/components/admin"
$galaxyCompDir = "src/components/galaxy"

if (-not (Test-Path $adminAppDir)) {
    New-Item -Path $adminAppDir -ItemType Directory | Out-Null
    Write-Host "Created directory $adminAppDir"
}
if (-not (Test-Path $adminLicensesDir)) {
    New-Item -Path $adminLicensesDir -ItemType Directory | Out-Null
    Write-Host "Created directory $adminLicensesDir"
}
if (-not (Test-Path $adminCompDir)) {
    New-Item -Path $adminCompDir -ItemType Directory | Out-Null
    Write-Host "Created directory $adminCompDir"
}
if (-not (Test-Path $galaxyCompDir)) {
    # Create galaxy components directory if it doesn't exist (in case Step 7 not added)
    New-Item -Path $galaxyCompDir -ItemType Directory | Out-Null
    Write-Host "Ensured directory $galaxyCompDir exists"
}

# 2. Create/update src/app/admin/layout.tsx
$adminLayoutPath = "src/app/admin/layout.tsx"
Write-Host "Updating admin layout file: $adminLayoutPath"
@"
import {{ getServerSession }} from "next-auth";
import {{ authOptions }} from "@/pages/api/auth/[...nextauth]";
import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";
import {{ redirect }} from "next/navigation";

export default async function AdminLayout({{ children }}: {{ children: React.ReactNode }}) {{
  // Server-side session check for admin role
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {{
    redirect("/");
  }}

  return (
    <div className="min-h-screen bg-gradient-to-bl from-violet-500 to-fuchsia-500 text-white flex">
      {/* Sidebar Navigation */}
      <nav className="w-64 p-6 bg-slate-900/30 backdrop-blur-md shadow-xl shadow-black/20 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Admin Menu</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/admin" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/licenses" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Licenses
            </Link>
          </li>
          <li>
            <Link href="/admin/batches" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Batches
            </Link>
          </li>
          <li>
            <Link href="/admin/lab-results" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              Lab Results
            </Link>
          </li>
          <li>
            <Link href="/admin/uploads" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              COA Uploads
            </Link>
          </li>
          <li>
            <Link href="/admin/states" className="block px-3 py-2 rounded-md hover:bg-emerald-500/20">
              States
            </Link>
          </li>
        </ul>
        <div className="mt-auto pt-6">
          {/* Sign-out button (appears at bottom of sidebar) */}
          <SignOutButton />
        </div>
      </nav>

      {/* Main content area */}
      <main className="flex-1">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}}
"@ | Set-Content -Path $adminLayoutPath

# 3. Create/update src/app/admin/licenses/page.tsx
$adminPagePath = "src/app/admin/licenses/page.tsx"
Write-Host "Creating admin licenses page: $adminPagePath"
@"
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
"@ | Set-Content -Path $adminPagePath

# 4. Create/update src/components/admin/LicenseAdminTable.tsx
$licenseTablePath = "src/components/admin/LicenseAdminTable.tsx"
Write-Host "Creating LicenseAdminTable component: $licenseTablePath"
@"
"use client";
import React, {{ useState, useMemo, useEffect }} from 'react';

interface LicenseData {{
  licenseNumber: string;
  entityName: string | null;
  stateCode: string;
  status: string;
  transparencyScore: number | null;
}}

interface Props {{
  licenses: LicenseData[];
}}

const LicenseAdminTable: React.FC<Props> = ({{ licenses }}) => {{
  // State for search, filters, sorting, and pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [sortKey, setSortKey] = useState<"entityName" | "transparencyScore" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 50;  // licenses per page

  // Reset to first page whenever filters or sorting change
  useEffect(() => {{
    setCurrentPage(0);
  }}, [searchQuery, filterJurisdiction, filterStatus, sortKey, sortOrder]);

  // Options for jurisdiction & status filters
  const jurisdictions = useMemo(() => {{
    const allStates = Array.from(new Set(licenses.map(l => l.stateCode).filter(Boolean)));
    return ["All", ...allStates.sort()];
  }}, [licenses]);
  const statuses = useMemo(() => {{
    const allStatuses = Array.from(new Set(licenses.map(l => l.status).filter(Boolean)));
    return ["All", ...allStatuses.sort()];
  }}, [licenses]);

  // Apply search and filters
  const filteredLicenses = useMemo(() => {{
    return licenses.filter(l => {{
      const matchesSearch =
        l.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.entityName && l.entityName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesJurisdiction = (filterJurisdiction === "All" || l.stateCode === filterJurisdiction);
      const matchesStatus = (filterStatus === "All" || l.status === filterStatus);
      return matchesSearch && matchesJurisdiction && matchesStatus;
    }});
  }}, [licenses, searchQuery, filterJurisdiction, filterStatus]);

  // Apply sorting
  const sortedLicenses = useMemo(() => {{
    if (!sortKey) return filteredLicenses;
    const sorted = [...filteredLicenses].sort((a, b) => {{
      let cmp = 0;
      if (sortKey === "entityName") {{
        // Compare names (handle nulls as empty string)
        const nameA = a.entityName?.toLowerCase() || "";
        const nameB = b.entityName?.toLowerCase() || "";
        cmp = nameA.localeCompare(nameB);
      }} else if (sortKey === "transparencyScore") {{
        // Compare numeric scores (treat null as 0)
        const aScore = a.transparencyScore ?? 0;
        const bScore = b.transparencyScore ?? 0;
        cmp = aScore - bScore;
      }}
      return sortOrder === "asc" ? cmp : -cmp;
    }});
    return sorted;
  }}, [filteredLicenses, sortKey, sortOrder]);

  // Pagination – slice the sorted list for current page
  const totalResults = sortedLicenses.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults);
  const pageResults = sortedLicenses.slice(startIndex, endIndex);

  const toggleSort = (key: "entityName" | "transparencyScore") => {{
    if (sortKey === key) {{
      // If already sorting by this key, just flip order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    }} else {{
      setSortKey(key);
      setSortOrder("asc");
    }}
  }};

  return (
    <div className="space-y-4">
      {/* Page Title and description */}
      <div>
        <h1 className="text-2xl font-semibold">Licenses</h1>
        <p className="text-sm text-slate-400">
          Browse all licenses and their transparency scores. Use search or filters to narrow results.
        </p>
      </div>

      {/* Filters: search, jurisdiction, status */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
        <input
          type="text"
          placeholder="Search license # or name..."
          value={{searchQuery}}
          onChange={{ e => setSearchQuery(e.target.value) }}
          className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm"
        />
        <select
          value={{filterJurisdiction}}
          onChange={{ e => setFilterJurisdiction(e.target.value) }}
          className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-100 text-sm"
        >
          {{jurisdictions.map(j => (
            <option key={{j}} value={{j}}>{{j}}</option>
          ))}}
        </select>
        <select
          value={{filterStatus}}
          onChange={{ e => setFilterStatus(e.target.value) }}
          className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-100 text-sm"
        >
          {{statuses.map(s => (
            <option key={{s}} value={{s}}>{{s}}</option>
          ))}}
        </select>
      </div>

      {/* Licenses table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-lg shadow-black/30 p-4 overflow-auto">
        <table className="w-full border-collapse text-sm text-slate-100">
          <thead>
            <tr className="bg-slate-800/60 text-slate-200 text-left">
              <th className="py-2 px-3">License #</th>
              <th 
                onClick={{() => toggleSort("entityName")}}
                className="py-2 px-3 cursor-pointer"
              >
                Name {sortKey === "entityName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="py-2 px-3">Jurisdiction</th>
              <th className="py-2 px-3">Status</th>
              <th 
                onClick={{() => toggleSort("transparencyScore")}}
                title="Transparency score is an internal metric based on data completeness (not an official compliance measure)."
                className="py-2 px-3 cursor-pointer"
              >
                Transparency Score {sortKey === "transparencyScore" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {{pageResults.map(l => (
              <tr key={{l.licenseNumber}} className="hover:bg-slate-800/30">
                <td className="px-3 py-1">{{l.licenseNumber}}</td>
                <td className="px-3 py-1">{{l.entityName || ""}}</td>
                <td className="px-3 py-1">{{l.stateCode}}</td>
                <td className="px-3 py-1">{{l.status}}</td>
                <td className="px-3 py-1">{{(l.transparencyScore ?? 0).toFixed(2)}}</td>
              </tr>
            ))}}
          </tbody>
        </table>

        {/* Pagination controls */}
        {totalResults > pageSize && (
          <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
            <span>
              Showing {{startIndex + 1}}-{{endIndex}} of {{totalResults}} licenses
            </span>
            <div className="space-x-2">
              <button 
                onClick={{() => setCurrentPage(p => p - 1)}} 
                disabled={{currentPage === 0}}
                className="px-3 py-1 rounded-md border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span>Page {{currentPage + 1}} of {{totalPages}}</span>
              <button 
                onClick={{() => setCurrentPage(p => p + 1)}} 
                disabled={{currentPage >= totalPages - 1}}
                className="px-3 py-1 rounded-md border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transparency score footnote */}
      <p className="text-xs text-slate-400 italic">
        * Transparency Score is an experimental internal metric and not an official compliance score.
      </p>
    </div>
  );
}};

export default LicenseAdminTable;
"@ | Set-Content -Path $licenseTablePath

# 5. Create/update src/components/admin/SignOutButton.tsx
$signOutPath = "src/components/admin/SignOutButton.tsx"
Write-Host "Creating SignOutButton component: $signOutPath"
@"
"use client";
import {{ signOut }} from "next-auth/react";
import React from "react";

const SignOutButton: React.FC = () => {
  return (
    <button
      onClick={() => signOut()}
      className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
    >
      Sign out
    </button>
  );
};

export default SignOutButton;
"@ | Set-Content -Path $signOutPath

# 6. Fix GalaxyScene missing module (Step 7) by adding a placeholder if not exists
$galaxyScenePath = "src/components/galaxy/GalaxyScene.tsx"
if (-not (Test-Path $galaxyScenePath)) {
    Write-Host "GalaxyScene component not found. Creating placeholder at $galaxyScenePath"
@"
import React from "react";
export type GalaxyLicense = any;
const GalaxyScene: React.FC = () => {
  return (
    <div className="p-4 text-sm text-red-500">
      GalaxyScene component is not yet implemented.
    </div>
  );
};
export default GalaxyScene;
"@ | Set-Content -Path $galaxyScenePath
} else {
    Write-Host "GalaxyScene component exists. Skipping placeholder creation."
}

Write-Host "Step 8 implementation completed. Files have been created/updated. Please review changes and run the app."
