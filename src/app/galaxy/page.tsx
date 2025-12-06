// src/app/galaxy/page.tsx
export const metadata = {
  title: "Transparency Galaxy – Coming Soon",
};

export default function GalaxyPlaceholderPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="max-w-md space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">
          Transparency Galaxy
        </p>
        <h1 className="text-2xl font-semibold">Galaxy View Temporarily Unavailable</h1>
        <p className="text-sm text-slate-400">
          We’ve paused the interactive map to focus on core features. The 3D “galaxy” of licenses will return once our data pipeline and UI are fully stable.
        </p>
      </div>
    </main>
  );
}
