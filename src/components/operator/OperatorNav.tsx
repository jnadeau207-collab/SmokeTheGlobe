// src/components/operator/OperatorNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  description?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/operator", label: "Overview" },
  { href: "/operator/licenses", label: "Licenses" },
  { href: "/operator/batches", label: "Batches" },
  { href: "/operator/coas", label: "COAs" },
  { href: "/operator/analytics", label: "Analytics" },
];

export default function OperatorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 backdrop-blur">
      <div className="mr-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-emerald-500/60 bg-emerald-500/10 text-[11px] font-semibold text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
          OPS
        </div>
        <div className="hidden text-xs text-slate-300 sm:block">
          <div className="font-semibold text-slate-50">
            Operator control room
          </div>
          <div className="text-[11px] text-slate-400">
            Seed-to-sale & facility telemetry
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/operator"
              ? pathname === "/operator"
              : pathname.startsWith(item.href);

          return (
            <OperatorNavLink key={item.href} href={item.href} active={active}>
              {item.label}
            </OperatorNavLink>
          );
        })}
      </div>
    </nav>
  );
}

function OperatorNavLink({
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
          ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
          : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-emerald-400/60 hover:text-emerald-100",
      ].join(" ")}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 mr-2 opacity-70" />
      {children}
    </Link>
  );
}
