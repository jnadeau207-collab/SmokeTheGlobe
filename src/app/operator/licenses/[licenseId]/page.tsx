// src/app/operator/licenses/[licenseId]/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LicenseDashboardPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const { licenseId } = await params;

  // The layout already fetched the license details; this page is just
  // the "inner control room" with tiles into sub-modules.
  const basePath = `/operator/licenses/${licenseId}`;

  const tiles = [
    {
      href: `${basePath}/rooms`,
      title: "Rooms & facilities",
      body: "Grow rooms, vaults, trim areas, packaging lines, and storage zones.",
    },
    {
      href: `${basePath}/plants`,
      title: "Plants & growth cycles",
      body: "Track plants from seeds and clones through veg, flower, and harvest.",
    },
    {
      href: `${basePath}/batches`,
      title: "Batches & packages",
      body: "Create, split, and combine production lots, packages, and transfers.",
    },
    {
      href: `${basePath}/inventory`,
      title: "Inventory & COGS",
      body: "Realtime stock, cost of goods sold, and materials consumption.",
    },
    {
      href: `${basePath}/coas`,
      title: "COAs & lab results",
      body: "Attach lab reports, track compliance limits, and recall history.",
    },
    {
      href: `${basePath}/analytics`,
      title: "Analytics & KPIs",
      body: "License-level revenue, throughput, loss, potency, and safety KPIs.",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
        >
          <h2 className="text-sm font-semibold text-slate-50 group-hover:text-emerald-100">
            {tile.title}
          </h2>
          <p className="mt-1 text-[12px] text-slate-400">{tile.body}</p>
          <p className="mt-2 text-[11px] text-emerald-200/80">
            Open module →
          </p>
        </Link>
      ))}
    </div>
  );
}
