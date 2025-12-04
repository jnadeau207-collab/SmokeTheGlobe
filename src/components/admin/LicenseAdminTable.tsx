// src/components/admin/LicenseAdminTable.tsx
"use client";
import React, { useState, useMemo } from "react";

interface LicenseData {
  licenseNumber: string;
  entityName: string | null;
  stateCode: string | null;
  status: string | null;
  transparencyScore: number | null;
}
interface Props {
  licenses: LicenseData[];
}

const LicenseAdminTable: React.FC<Props> = ({ licenses }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJurisdiction, setFilterJurisdiction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortKey, setSortKey] = useState<"entityName" | "transparencyScore" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Compute unique filter options for jurisdiction and status
  const jurisdictions = useMemo(() => {
    const set = new Set(licenses.map((l) => l.stateCode || ""));
    set.delete("");
    return ["All", ...Array.from(set).sort()];
  }, [licenses]);
  const statuses = useMemo(() => {
    const set = new Set(licenses.map((l) => l.status || ""));
    set.delete("");
    return ["All", ...Array.from(set).sort()];
  }, [licenses]);

  // Filtered and sorted license list
  const filteredLicenses = useMemo(() => {
    return licenses
      .filter((l) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          l.licenseNumber.toLowerCase().includes(q) ||
          (l.entityName || "").toLowerCase().includes(q);
        const matchesJur =
          filterJurisdiction === "All" || l.stateCode === filterJurisdiction;
        const matchesStatus = filterStatus === "All" || l.status === filterStatus;
        return matchesSearch && matchesJur && matchesStatus;
      })
      .sort((a, b) => {
        if (!sortKey) return 0;
        const aVal = a[sortKey] || "";
        const bVal = b[sortKey] || "";
        const compare = String(aVal).localeCompare(String(bVal));
        return sortOrder === "asc" ? compare : -compare;
      });
  }, [licenses, searchQuery, filterJurisdiction, filterStatus, sortKey, sortOrder]);

  const toggleSort = (key: "entityName" | "transparencyScore") => {
    if (sortKey === key) {
      // toggle order if same key clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and search inputs */}
      <div className="flex flex-col items-start justify-between gap-2 pb-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search licenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 placeholder-slate-500"
          />
          <select
            value={filterJurisdiction}
            onChange={(e) => setFilterJurisdiction(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          >
            {jurisdictions.map((jur) => (
              <option key={jur} value={jur}>
                {jur === "All" ? "All Jurisdictions" : jur}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Statuses" : status}
              </option>
            ))}
          </select>
        </div>
        {/* (Optional) Export button */}
        <button
          onClick={() => window.location.href = "/api/admin/exports/licenses"} 
          className="mt-2 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-emerald-500 hover:text-emerald-300 sm:mt-0"
        >
          Export CSV
        </button>
      </div>

      {/* License table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-200 text-left text-xs uppercase">
            <tr>
              <th className="py-2 px-3">License #</th>
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Jurisdiction</th>
              <th className="py-2 px-3">Status</th>
              <th
                onClick={() => toggleSort("transparencyScore")}
                className="py-2 px-3 cursor-pointer"
                title="Transparency Score (click to sort)"
              >
                Transparency Score {sortKey === "transparencyScore" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLicenses.map((lic) => (
              <tr key={lic.licenseNumber} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                <td className="py-1.5 px-3">{lic.licenseNumber}</td>
                <td className="py-1.5 px-3">{lic.entityName || <span className="text-slate-500">Unnamed</span>}</td>
                <td className="py-1.5 px-3">{lic.stateCode || <span className="text-slate-500">–</span>}</td>
                <td className="py-1.5 px-3">{lic.status || <span className="text-slate-500">–</span>}</td>
                <td className="py-1.5 px-3">{lic.transparencyScore?.toFixed(1) ?? <span className="text-slate-500">–</span>}</td>
              </tr>
            ))}
            {filteredLicenses.length === 0 && (
              <tr>
                <td colSpan={5} className="py-2 px-3 text-center text-slate-500">
                  No licenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LicenseAdminTable;
