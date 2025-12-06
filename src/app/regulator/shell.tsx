// src/app/regulator/shell.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Regulator Console",
    items: [
      { href: "/regulator", label: "Overview" },
      // You can add more granular regulator pages later, e.g.:
      // { href: "/regulator/licenses", label: "Licenses" },
      // { href: "/regulator/recalls", label: "Recalls" },
    ],
  },
  {
    label: "Global Navigation",
    items: [
      { href: "/", label: "Public Explorer" },
      { href: "/admin", label: "Admin Center" },
      { href: "/operator", label: "Operator Suite" },
    ],
  },
];

export default function RegulatorShell({ children }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/regulator" && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/90 px-4 py-5 md:flex">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-500/50">
            <span className="text-sm font-bold text-sky-300">RG</span>
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
              Regulator
            </p>
            <p className="text-[11px] text-slate-400">Jurisdiction overview</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-2 text-xs">
          {navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 transition ${
                        active
                          ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/60"
                          : "text-slate-300 hover:bg-slate-900/60 hover:text-sky-200"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
