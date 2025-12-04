import GalaxyScene, {
  type GalaxyLicense,
} from "@/components/galaxy/GalaxyScene";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  let licenses: GalaxyLicense[] = [];
  let dbError = "";

  try {
    const raw = await prisma.stateLicense.findMany({
      select: {
        id: true,
        entityName: true,
        stateCode: true,
        transparencyScore: true,
      },
      take: 1500,
    });

    licenses = raw.map((row) => ({
      id: row.id,
      entityName: row.entityName,
      stateCode: row.stateCode,
      transparencyScore: row.transparencyScore,
    }));
  } catch (err: any) {
    console.error("Failed to load licenses for galaxy view", err);
    dbError =
      "Unable to reach the database right now. The galaxy will render, but without live license stars.";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto max-w-6xl px-6 pt-10 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-400/90">
          Transparency Galaxy
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          See licensed cannabis operators as a living starfield.
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Each point of light represents a licensed operator in the U.S. or
          Canada. Transparency scores determine how bright and how close to the
          core they appear, turning compliance data into an intuitive map.
        </p>
        {dbError && (
          <p className="max-w-3xl text-xs text-amber-400">
            {dbError} Make sure your{" "}
            <code className="font-mono">cartfax-dev</code> Postgres container is
            listening on <code className="font-mono">localhost:5432</code> and{" "}
            <code className="font-mono">DATABASE_URL</code> points at it.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <GalaxyScene licenses={licenses} />
      </section>
    </main>
  );
}
