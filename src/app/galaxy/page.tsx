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
      "Unable to reach the database. Showing an empty galaxy until Postgres is running.";
  }

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
          Cannabis Transparency Galaxy
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Explore licensed operators as a living starfield.
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Each point of light represents a state license. Transparency scores
          influence position, color, and intensity, turning public compliance
          data into an immersive map.
        </p>
        {dbError && (
          <p className="mt-1 text-xs text-amber-400">
            {dbError} Make sure your{" "}
            <code className="font-mono">cartfax-dev</code> Postgres database is
            listening on <code className="font-mono">localhost:5432</code> and
            that <code className="font-mono">DATABASE_URL</code> is configured.
          </p>
        )}
      </section>

      <GalaxyScene licenses={licenses} />
    </main>
  );
}
