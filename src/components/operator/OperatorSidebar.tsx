// src/components/operator/OperatorSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  helper?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
  // If undefined, section is visible to everyone.
  roles?: string[];
};

function useRoles(): string[] {
  const { data: session } = useSession();
  const user = (session?.user || {}) as any;
  const value = user.roles ?? user.role;
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function hasAccess(userRoles: string[], allowed?: string[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (userRoles.includes("admin")) return true; // admin sees everything
  return allowed.some((r) => userRoles.includes(r));
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/operator") return pathname === "/operator";
  if (href === "/admin") return pathname === "/admin";
  if (href === "/regulator") return pathname === "/regulator";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function OperatorSidebar() {
  const pathname = usePathname();
  const roles = useRoles();

  const sections: NavSection[] = [
    {
      title: "Operator workspace",
      roles: ["operator", "producer", "retailer", "admin"],
      items: [
        {
          href: "/operator",
          label: "Control room",
          helper: "Seed-to-sale & facility telemetry",
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
          helper: "Operator trends & KPIs",
        },
      ],
    },
    {
      title: "Admin center",
      roles: ["admin"],
      items: [
        {
          href: "/admin",
          label: "Admin overview",
          helper: "Global system controls",
        },
        {
          href: "/admin/licenses",
          label: "Licenses registry",
          helper: "Global license map",
        },
        {
          href: "/admin/batches",
          label: "Batches",
          helper: "Cross-license production",
        },
        {
          href: "/admin/lab-results",
          label: "Lab results",
          helper: "Global COA dataset",
        },
        {
          href: "/admin/brands",
          label: "Brands",
          helper: "Brand registry",
        },
        {
          href: "/admin/labs",
          label: "Labs",
          helper: "Lab profiles",
        },
        {
          href: "/admin/locations",
          label: "Locations",
          helper: "Sites & facilities",
        },
        {
          href: "/admin/recalls",
          label: "Recalls",
          helper: "Product safety events",
        },
        {
          href: "/admin/uploads",
          label: "COA uploads",
          helper: "Document ingestion",
        },
      ],
    },
    {
      title: "Regulator console",
      roles: ["regulator", "admin"],
      items: [
        {
          href: "/regulator",
          label: "Regulator overview",
          helper: "Jurisdiction-level telemetry",
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
      ],
    },
    {
      title: "Public surface",
      items: [
        {
          href: "/",
          label: "Public landing",
          helper: "Global search & map",
        },
        {
          href: "/analytics",
          label: "Public analytics",
          helper: "Open indicators",
        },
      ],
    },
  ];

  const visibleSections = sections.filter((section) =>
    hasAccess(roles, section.roles)
  );

  return (
    <aside className="rounded-2xl border border-emerald-500/40 bg-slate-950/90 p-4 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
          Global workspace
        </p>
        <p className="mt-1 text-[12px] text-slate-300">
          Navigate between operator suites, admin center, regulator console, and
          public surfaces from a single side panel. Items respect your role; admin
          sees everything, others see only what they should.
        </p>
      </div>

      <div className="space-y-4 text-[12px]">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex flex-col rounded-xl border px-3 py-2 transition",
                      active
                        ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        : "border-slate-800 bg-slate-950/80 text-slate-200 hover:border-emerald-400/60 hover:text-emerald-100",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-[6px] w-[6px] rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-80" />
                      <span className="font-medium">{item.label}</span>
                    </span>
                    {item.helper && (
                      <span className="mt-0.5 text-[11px] text-slate-400">
                        {item.helper}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
