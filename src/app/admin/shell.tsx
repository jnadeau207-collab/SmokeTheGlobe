// src/app/admin/shell.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface Props { children: ReactNode; }

const navSections = [
  {
    label: "Data Operations",
    items: [
      { href: "/admin/licenses", label: "Licenses" },
      { href: "/admin/batches", label: "Batches" },
      { href: "/admin/lab-results", label: "Lab Results" },
      { href: "/admin/uploads", label: "COA Uploads" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/brands", label: "Brands" },
      { href: "/admin/labs", label: "Labs" },
      { href: "/admin/locations", label: "Locations" },
      { href: "/admin/recalls", label: "Recalls" },
    ],
  },
  {
    label: "ETL & Feeds",
    items: [
      { href: "/admin/etl", label: "ETL Control Center" },
    ],
  },
  {
    label: "Suites & Navigation",
    items: [
      { href: "/", label: "Public Explorer" },
      { href: "/operator", label: "Operator Suite" },
      { href: "/regulator", label: "Regulator Console" },
      { href: "/analytics", label: "Analytics Lab" },
    ],
  },
];

export default function AdminShell({ children }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Get user info for display
  const userName = session?.user?.name || session?.user?.email || "Admin";
  const userRole = (session?.user as any)?.role || "admin";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950/80 p-4 sm:flex">
        <div className="px-1 pb-6">
          <Link href="/" className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            SmokeTheGlobe
          </Link>
          <p className="mt-1 text-sm font-medium text-slate-100">
            Cannabis Data Command Center
          </p>
          <p className="text-xs text-slate-500">
            Administrative console for licenses, transparency, and compliance.
          </p>
        </div>
        <nav className="flex-1 space-y-6 text-sm">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </div>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={[
                          "block rounded-md px-3 py-1.5",
                          active
                            ? "bg-slate-800 text-emerald-300"
                            : "text-slate-300 hover:bg-slate-900 hover:text-emerald-200"
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-800 pt-4 text-xs">
          <div className="mb-2 px-1 text-slate-300">
            <div>{userName}</div>
            <div className="text-slate-500">Role: {userRole}</div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-emerald-500 hover:text-emerald-300"
          >
            Sign Out
          </button>
        </div>
      </aside>
      {/* Main content area */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
