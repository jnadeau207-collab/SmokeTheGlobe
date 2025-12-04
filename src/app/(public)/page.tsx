// src/app/(public)/page.tsx
export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-4 text-3xl font-semibold sm:text-4xl">
        Global cannabis transparency, from seed to sale.
      </h1>
      <p className="max-w-2xl text-sm text-slate-400">
        SmokeTheGlobe ingests licensing, lab reports, and supply-chain data to give patients, regulators, and operators a shared source of truth.
      </p>
      {/* TODO: Insert your existing search/map component here if migrating the landing page to App Router. */}
    </main>
  );
}
