// src/components/regulator/RegulatorSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  helper?: string;
};

const REGULATOR_ITEMS: NavItem[] = [
  {
    href: "/regulator",
    label: "Overview",
    helper: "Jurisdiction telemetry",
  },
  {
    href: "/regulator/licenses",
    label: "Licenses",
    helper: "Licensed entities",
  },
  {
    href: "/regulator/coas",
    label: "COAs & recalls",
    helper: "Testing & safety",
  },
  {
    href: "/regulator/analytics",
    label: "Analytics",
    helper: "Market & compliance trends",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/regulator") {
    return pathname === "/regulator";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function RegulatorSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <aside className="flex h-full flex-col border-r border-slate-800 bg-slate-950/95 px-4 py-5 text-[13px] text-slate-200">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-300/80">
          Regulator console
        </p>
        <p className="mt-1 text-[12px] text-slate-300">
          Jurisdiction-wide oversight of licenses, COAs, recalls, and market
          analytics. Private operator data is only shown where policy allows.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-left text-[12px] hover:border-sky-400/60 hover:text-sky-100"
      >
        <span className="font-semibold">Regulator navigation</span>
        <span className="text-[10px] text-slate-500">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <nav className="mt-3 space-y-1">
          {REGULATOR_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-lg border px-3 py-2 transition",
                  active
                    ? "border-sky-400/70 bg-sky-500/15 text-sky-50 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                    : "border-slate-800 bg-slate-950/80 text-slate-200 hover:border-sky-400/60 hover:text-sky-100",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <span className="text-[10px] text-sky-300">• active</span>
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
        <p className="font-semibold text-slate-300">Jurisdiction scope</p>
        <p className="mt-1">
          In the next phase we’ll wire this console to jurisdiction codes so
          regulators only see data in their region, while admins retain global
          access.
        </p>
      </div>
    </aside>
  );
}
