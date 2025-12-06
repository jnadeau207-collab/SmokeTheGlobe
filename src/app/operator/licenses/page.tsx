// src/app/operator/licenses/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Operator licenses · Smoke The Globe",
};

export const dynamic = "force-dynamic";

// Server action to create a license manually (no ETL required).
async function createLicense(formData: FormData) {
  "use server";

  // Admin + operator roles are allowed to create licenses.
  await requireRole(["admin", "operator", "producer", "retailer"], "/operator");

  const entityName = formData.get("entityName")?.toString().trim();
  const licenseNumber = formData.get("licenseNumber")?.toString().trim();

  if (!entityName || !licenseNumber) {
    // In the future we can surface validation errors, but for now just no-op.
    return;
  }

  await prisma.stateLicense.create({
    data: {
      entityName,
      licenseNumber,
      // Any fields with defaults (e.g. countryCode) will be auto-filled by Prisma.
    },
  });

  // Refresh the licenses list and return to this page.
  revalidatePath("/operator/licenses");
  redirect("/operator/licenses");
}

export default async function OperatorLicensesPage() {
  const licenses = await prisma.stateLicense.findMany({
    orderBy: { entityName: "asc" },
    take: 100,
    select: {
      id: true,
      licenseNumber: true,
      entityName: true,
    },
  });

  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-[-4rem] bottom-[-6rem] h-64 w-64 rounded-full bg-cyan-500/16 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(#1f2937_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <div className="relative z-10 space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Your licenses</h1>
            <p className="mt-1 text-[12px] text-slate-400">
              Select a license to open its full seed-to-sale workspace: rooms,
              plants, batches, packages, inventory, and COAs. You can also
              inject licenses manually here – no state data or ETL required.
            </p>
          </div>
          <Link
            href="/operator"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300 hover:border-emerald-400/60 hover:text-emerald-100"
          >
            ← Back to operator overview
          </Link>
        </header>

        {/* Quick create license panel */}
        <section className="mt-2 rounded-2xl border border-emerald-500/40 bg-slate-950/90 p-4 text-[12px] text-slate-300 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/80">
                Create a license
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Admins and operators can inject licenses manually so the full
                seed-to-sale suite is available even before any state or ETL
                data is hooked up.
              </p>
            </div>
          </div>

          <form
            action={createLicense}
            className="mt-3 grid gap-3 text-[12px] sm:grid-cols-[1.5fr,1fr,auto]"
          >
            <div className="space-y-1">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Entity name
              </label>
              <input
                name="entityName"
                required
                placeholder="e.g. Smoke The Globe Labs"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-[12px] text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                License number
              </label>
              <input
                name="licenseNumber"
                required
                placeholder="e.g. ABC-123456"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-[12px] text-slate-50 outline-none ring-emerald-500/30 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/70 bg-emerald-500/90 px-4 py-2 text-[12px] font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                + Create license
              </button>
            </div>
          </form>
        </section>

        {/* License list */}
        {licenses.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-[12px] text-slate-400">
            No license records found yet. Create a license above. Once records
            exist, each tile will open a full seed-to-sale suite for that
            license.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {licenses.map((lic) => (
              <Link
                key={lic.id}
                href={`/operator/licenses/${lic.id}`}
                className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  License
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-50">
                  {lic.entityName}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  License number:{" "}
                  <code className="rounded bg-slate-900/80 px-1.5 py-0.5 text-[11px] text-slate-200">
                    {lic.licenseNumber}
                  </code>
                </p>
                <p className="mt-2 text-[11px] text-emerald-200/80">
                  Open seed-to-sale suite →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
