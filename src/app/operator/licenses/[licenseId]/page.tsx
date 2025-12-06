// src/app/operator/licenses/[licenseId]/page.tsx

export const metadata = {
  title: "License dashboard · Smoke The Globe",
};

export default function LicenseDashboardPage() {
  // License header & nav are handled by the layout.
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <QuickCard
        label="Rooms"
        description="Define grow rooms, mother rooms, cure rooms, trim areas, vaults, and sales floors for this license."
        href="rooms"
      />
      <QuickCard
        label="Plants"
        description="Track plants by phase (clone, veg, flower), genetics, and room. Link plants to harvest and batch records."
        href="plants"
      />
      <QuickCard
        label="Seeds & genetics"
        description="Manage seed lots, strains, and vendors. Tie upstream genetics to downstream plant and batch outcomes."
        href="seeds"
      />
      <QuickCard
        label="Batches"
        description="Harvest and production batches, lots, and transformations (trim, biomass, finished goods)."
        href="batches"
      />
      <QuickCard
        label="Packages"
        description="Retail-ready units, wholesale cases, and transfer packages with status and destination."
        href="packages"
      />
      <QuickCard
        label="Inventory & COGS"
        description="Supplies, nutrients, packaging, office materials, and cost-of-goods tracking for this license."
        href="inventory"
      />
    </div>
  );
}

function QuickCard({
  label,
  description,
  href,
}: {
  label: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300 transition hover:-translate-y-0.5 hover:border-emerald-400/60 hover:text-emerald-50 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)]"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-50">{label}</h2>
        <span className="text-[11px] text-emerald-300 group-hover:text-emerald-200">
          Open →
        </span>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{description}</p>
    </a>
  );
}
