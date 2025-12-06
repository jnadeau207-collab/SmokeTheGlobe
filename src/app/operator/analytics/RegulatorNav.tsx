// src/components/regulator/RegulatorNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/regulator", label: "Overview" },
  { href: "/regulator/licenses", label: "Licenses" },
  { href: "/regulator/coas", label: "COAs & Recalls" },
  { href: "/regulator/analytics", label: "Analytics" },
];

export default function RegulatorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 backdrop-blur">
      <div className="mr-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-violet-500/60 bg-violet-500/15 text-[11px] font-semibold text-violet-200 shadow-[0_0_25px_rgba(139,92,246,0.5)]">
          REG
        </div>
        <div className="hidden text-xs text-slate-300 sm:block">
          <div className="font-semibold text-slate-50">
            Regulator console
          </div>
          <div className="text-[11px] text-slate-400">
            Jurisdictional oversight & compliance
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/regulator"
              ? pathname === "/regulator"
              : pathname.startsWith(item.href);
          return (
            <RegulatorNavLink
              key={item.href}
              href={item.href}
              active={active}
            >
              {item.label}
            </RegulatorNavLink>
          );
        })}
      </div>
    </nav>
  );
}

function RegulatorNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
        active
          ? "border-violet-400/70 bg-violet-500/20 text-violet-100 shadow-[0_0_18px_rgba(139,92,246,0.45)]"
          : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-violet-400/60 hover:text-violet-100",
      ].join(" ")}
    >
      <span className="mr-2 h-[6px] w-[6px] rounded-full bg-gradient-to-br from-violet-400 to-emerald-400 opacity-70" />
      {children}
    </Link>
  );
}
