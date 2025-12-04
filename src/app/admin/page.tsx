// src/app/admin/page.tsx
export default function AdminIndexPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-sm text-slate-400">
        Welcome to the SmokeTheGlobe admin console. Use the sidebar to manage data and monitor the platform.
      </p>
      {/* You can add summary stats or quick links here in the future */}
    </div>
  );
}
