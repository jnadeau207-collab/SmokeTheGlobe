// src/app/operator/licenses/[licenseId]/rooms/page.tsx

export const metadata = {
  title: "Rooms · License suite · Smoke The Globe",
};

export default function LicenseRoomsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-50">Rooms</h2>
        <p className="mt-1 text-[12px] text-slate-400">
          Define and manage all physical spaces under this license: grow rooms,
          mother rooms, dry/cure areas, trim rooms, manufacturing rooms, vaults,
          and sales floors. Eventually, plant and batch flows will be anchored
          to these rooms.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[12px] text-slate-300">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Coming next
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] text-slate-300">
          <li>Room creation & editing (name, type, capacity, status).</li>
          <li>Room utilization views by plant count, canopy square footage.</li>
          <li>Environmental telemetry hooks (temp, humidity, CO₂) per room.</li>
          <li>Audit trails for room status changes and movements.</li>
        </ul>
      </section>
    </div>
  );
}
