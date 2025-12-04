export default function OperatorHomePage() {
  return (
    <div className="space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Facility Overview</h1>
      <p className="text-sm text-slate-400">
        Welcome to the operator portal. Here you will manage inventory, track batches, and monitor compliance for your licensed facility.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Rooms", "Inventory", "Seed-to-Sale", "Compliance", "Tasks", "Reports"].map((section) => (
          <div key={section} className="flex h-28 flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="font-medium text-slate-100">{section}</div>
            <div className="text-xs text-slate-500">
              {section === "Seed-to-Sale"
                ? "Track product movement from cultivation to sale."
                : section === "Compliance"
                ? "View inspections, audits, and alerts."
                : `Manage ${section.toLowerCase()} for your facility.`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
