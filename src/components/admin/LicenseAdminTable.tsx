// components/admin/LicenseAdminTable.tsx
"use client";

import { useMemo, useState } from "react";

export interface LicenseRow {
  id: string;
  licenseNumber: string;
  entityName: string;
  stateCode: string;
  status: string;
  transparencyScore: number;
}

export default function LicenseAdminTable({
  licenses,
}: {
  licenses: LicenseRow[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortKey, setSortKey] = useState<"entityName" | "transparencyScore" | null>(
    null
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAll, setShowAll] = useState(false);

  const uniqueStates = useMemo(() => {
    const s = Array.from(new Set(licenses.map((l) => l.stateCode).filter(Boolean)));
    s.sort();
    return ["All", ...s];
  }, [licenses]);

  const uniqueStatuses = useMemo(() => {
    const s = Array.from(new Set(licenses.map((l) => l.status).filter(Boolean)));
    s.sort();
    return ["All", ...s];
  }, [licenses]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return licenses.filter((l) => {
      const matchesSearch =
        !q ||
        l.licenseNumber.toLowerCase().includes(q) ||
        l.entityName.toLowerCase().includes(q);

      const matchesState = filterState === "All" || l.stateCode === filterState;
      const matchesStatus = filterStatus === "All" || l.status === filterStatus;

      return matchesSearch && matchesState && matchesStatus;
    });
  }, [licenses, searchQuery, filterState, filterStatus]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "entityName") {
        cmp = a.entityName.localeCompare(b.entityName);
      } else if (sortKey === "transparencyScore") {
        cmp = a.transparencyScore - b.transparencyScore;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortOrder]);

  const MAX_DISPLAY = 200;
  const tooMany =
    sorted.length > MAX_DISPLAY &&
    filterState === "All" &&
    filterStatus === "All" &&
    searchQuery.trim() === "";

  const displayed = !showAll && tooMany ? sorted.slice(0, MAX_DISPLAY) : sorted;

  function toggleSort(key: "entityName" | "transparencyScore") {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-xl shadow-emerald-500/15 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              Licenses & Transparency
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Search, filter, and sort licenses by jurisdiction and transparency
              score. Read-only internal view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1">
              {licenses.length.toLocaleString()} records
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search license # or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 sm:w-72"
          />
          <div className="flex flex-1 flex-wrap gap-2">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            >
              {uniqueStates.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All states" : s}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            >
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-inner shadow-black/40">
          <div className="max-h-[540px] overflow-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-slate-950/80 text-slate-400">
                <tr>
                  <th className="sticky top-0 z-10 border-b border-slate-800/80 px-3 py-2 text-left">
                    License #
                  </th>
                  <th
                    className="sticky top-0 z-10 border-b border-slate-800/80 px-3 py-2 text-left cursor-pointer select-none"
                    onClick={() => toggleSort("entityName")}
                  >
                    Name{" "}
                    {sortKey === "entityName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="sticky top-0 z-10 border-b border-slate-800/80 px-3 py-2 text-left">
                    State
                  </th>
                  <th className="sticky top-0 z-10 border-b border-slate-800/80 px-3 py-2 text-left">
                    Status
                  </th>
                  <th
                    className="sticky top-0 z-10 border-b border-slate-800/80 px-3 py-2 text-left cursor-pointer select-none"
                    title="Transparency score is an internal metric based on data completeness; not a legal rating."
                    onClick={() => toggleSort("transparencyScore")}
                  >
                    Transparency{" "}
                    {sortKey === "transparencyScore"
                      ? sortOrder === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-slate-900/80 bg-slate-950/50 hover:bg-slate-900/60"
                  >
                    <td className="px-3 py-1.5 text-slate-300">
                      {l.licenseNumber}
                    </td>
                    <td className="px-3 py-1.5 text-slate-200">
                      {l.entityName}
                    </td>
                    <td className="px-3 py-1.5 text-slate-200">{l.stateCode}</td>
                    <td className="px-3 py-1.5 text-slate-200">{l.status}</td>
                    <td className="px-3 py-1.5 text-slate-200">
                      {l.transparencyScore.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      No licenses match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footers & notices */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-slate-500">
          <p>
            * Transparency Score is an internal metric for data completeness. It
            is not an official regulatory rating or compliance score.
          </p>
          {tooMany && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[0.7rem] text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
            >
              Show all {sorted.length.toLocaleString()} records
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
