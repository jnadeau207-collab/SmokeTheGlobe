// src/components/operator/LicenseSuiteNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  helper?: string;
};

const buildItems = (licenseId: string): NavItem[] => [
  {
    href: `/operator/licenses/${licenseId}`,
    label: "Dashboard",
    helper: "Overview",
  },
  {
    href: `/operator/licenses/${licenseId}/rooms`,
    label: "Rooms",
    helper: "Grow & processing spaces",
  },
  {
    href: `/operator/licenses/${licenseId}/plants`,
    label: "Plants",
    helper: "Plant lifecycle & lots",
  },
  {
    href: `/operator/licenses/${licenseId}/seeds`,
    label: "Seeds & genetics",
    helper: "Seed lots & strains",
  },
  {
    href: `/operator/licenses/${licenseId}/packages`,
    label: "Packages",
    helper: "Sellable units",
  },
  {
    href: `/operator/licenses/${licenseId}/batches`,
    label: "Batches",
    helper: "Production & harvest batches",
  },
  {
    href: `/operator/licenses/${licenseId}/inventory`,
    label: "Inventory & COGS",
    helper: "Supplies & cost tracking",
  },
];

export default function LicenseSuiteNav({ licenseId }: { licenseId: string }) {
  const pathname = usePathname();
  const items = buildItems(licenseId);

  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-[11px]">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex min-w-[140px] flex-col rounded-xl border px-3 py-2 transition",
              active
                ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : "border-slate-800 bg-slate-950/80 text-slate-200 hover:border-emerald-400/60 hover:text-emerald-100",
            ].join(" ")}
          >
            <span className="font-semibold">{item.label}</span>
            {item.helper && (
              <span className="mt-0.5 text-[10px] text-slate-400">
                {item.helper}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
