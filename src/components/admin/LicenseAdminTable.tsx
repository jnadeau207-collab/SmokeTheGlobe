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

    // Compute dropdown options for jurisdictions and statuses
    const jurisdictions = useMemo(() => {
        const states = Array.from(new Set(licenses.map(l => l.stateCode).filter(Boolean)));
        return ["All", ...states.sort()];
    }, [licenses]);
    const statuses = useMemo(() => {
        const stats = Array.from(new Set(licenses.map(l => l.status).filter(Boolean)));
        return ["All", ...stats.sort()];
    }, [licenses]);

    // Filter licenses based on search text, selected jurisdiction, and status
    const filteredLicenses = useMemo(() => {
        return licenses.filter(l => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                l.licenseNumber.toLowerCase().includes(query) ||
                (l.entityName ?? "").toLowerCase().includes(query);
            const matchesJurisdiction = (filterJurisdiction === "All" || l.stateCode === filterJurisdiction);
            const matchesStatus = (filterStatus === "All" || l.status === filterStatus);
            return matchesSearch && matchesJurisdiction && matchesStatus;
        });
    }, [licenses, searchQuery, filterJurisdiction, filterStatus]);

    // Sort filtered results if a sort key is selected
    const sortedLicenses = useMemo(() => {
        if (!sortKey) return filteredLicenses;
        const sorted = [...filteredLicenses].sort((a, b) => {
            let cmp = 0;
            if (sortKey === "entityName") {
                cmp = (a.entityName ?? "").localeCompare(b.entityName ?? "");
            } else if (sortKey === "transparencyScore") {
                const aScore = a.transparencyScore ?? 0;
                const bScore = b.transparencyScore ?? 0;
                cmp = aScore - bScore;
            }
            return sortOrder === "asc" ? cmp : -cmp;
        });
        return sorted;
    }, [filteredLicenses, sortKey, sortOrder]);

    const toggleSort = (key: "entityName" | "transparencyScore") => {
        if (sortKey === key) {
            // If already sorting by this key, flip the sort order
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    // Limit displayed results to avoid extremely long lists (prompt user to filter more if needed)
    const maxDisplay = 200;
    const displayLicenses = sortedLicenses.slice(0, maxDisplay);

    return (
        <div>
            {/* Controls: Search and Filters */}
            <h1 className="text-2xl font-semibold mb-4">Licenses</h1>
            <div className="mb-4 space-x-2">
                <input
                    type="text"
                    placeholder="Search license # or name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-3 py-1 rounded bg-slate-800/50 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                    value={filterJurisdiction}
                    onChange={e => setFilterJurisdiction(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-800/50 text-slate-100"
                >
                    {jurisdictions.map(j => (
                        <option key={j} value={j}>{j}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-800/50 text-slate-100"
                >
                    {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
            {/* License Data Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-800/60 text-slate-200 text-left">
                        <tr>
                            <th className="py-2 px-3">License #</th>
                            <th
                                onClick={() => toggleSort("entityName")}
                                className="py-2 px-3 cursor-pointer"
                            >
                                Name {sortKey === "entityName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th className="py-2 px-3">Jurisdiction</th>
                            <th className="py-2 px-3">Status</th>
                            <th
                                onClick={() => toggleSort("transparencyScore")}
                                title="Transparency score is an internal metric based on data completeness (not an official compliance measure)."
                                className="py-2 px-3 cursor-pointer"
                            >
                                Transparency Score {sortKey === "transparencyScore" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-950/50 text-slate-100">
                        {displayLicenses.map(l => (
                            <tr key={l.licenseNumber} className="border-t border-slate-800">
                                <td className="py-1.5 px-3">{l.licenseNumber}</td>
                                <td className="py-1.5 px-3">{l.entityName ?? ""}</td>
                                <td className="py-1.5 px-3">{l.stateCode ?? ""}</td>
                                <td className="py-1.5 px-3">{l.status ?? ""}</td>
                                <td className="py-1.5 px-3">{(l.transparencyScore ?? 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedLicenses.length > maxDisplay && (
                <p className="mt-2 text-xs text-amber-400">
                    Showing first {maxDisplay} of {sortedLicenses.length} results. Please refine your search to see more.
                </p>
            )}
            <p className="mt-4 text-xs text-slate-400">
                * Transparency Score is an experimental internal metric and not a regulatory compliance indicator.
            </p>
        </div>
    );
};

export default LicenseAdminTable;
