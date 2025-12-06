// src/components/operator/OperatorSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  helper?: string;
};

const OPERATOR_ITEMS: NavItem[] = [
  {
    href: "/operator",
    label: "Control room",
    helper: "High-level telemetry",
  },
  {
    href: "/operator/licenses",
    label: "Licenses",
    helper: "Seed-to-sale suites",
  },
  {
    href: "/operator/batches",
    label: "Batches",
    helper: "Production lots",
  },
  {
    href: "/operator/coas",
    label: "COAs",
    helper: "Certificates of Analysis",
  },
  {
    href: "/operator/analytics",
    label: "Analytics hub",
    helper: "Trends & KPIs",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/operator") {
    return pathname === "/operator";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function OperatorSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(true);

  const defaultOpen =
    pathname.startsWith("/operator") || pathname.startsWith("/operator/");
  const isOpen = open ?? defaultOpen;

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-[13px] text-slate-200 shadow-[0_0_40px_rgba(16,185,129,0.18)] lg:flex lg:w-60 lg:flex-col lg:overflow-y-auto">
      {/* Header */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
          Operator suite
        </p>
        <p className="mt-1 text-[12px] text-slate-300">
          Full seed-to-sale workspace for your licenses: telemetry, batches,
          COAs, and analytics.
        </p>
      </div>

      {/* Collapsible block */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-left text-[12px] hover:border-emerald-400/60 hover:text-emerald-100"
      >
        <span className="font-semibold">Operator navigation</span>
        <span className="text-[10px] text-slate-500">
          {isOpen ? "▾" : "▸"}
        </span>
      </button>

      {isOpen && (
        <nav className="mt-3 space-y-1">
          {OPERATOR_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-lg border px-3 py-2 transition",
                  active
                    ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "border-slate-800 bg-slate-950/80 text-slate-200 hover:border-emerald-400/60 hover:text-emerald-100",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <span className="text-[10px] text-emerald-300">
                      • active
                    </span>
                  )}
                </div>
                {item.helper && (
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {item.helper}
                  </p>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Tip</p>
        <p className="mt-1">
          Use these links to move around the operator suite. Once you open a
          specific license, the in‑license workspace (rooms, plants, batches,
          inventory) will appear on that screen.
        </p>
      </div>
    </aside>
  );
}
