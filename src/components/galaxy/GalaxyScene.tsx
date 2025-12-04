"use client";

import React from "react";

export type GalaxyLicense = {
  id: number | string;
  entityName?: string | null;
  stateCode?: string | null;
  transparencyScore?: number | null; // 0–100
};

type Props = {
  licenses: GalaxyLicense[];
};

const VIEWBOX_SIZE = 800;
const CENTER = VIEWBOX_SIZE / 2;
const INNER_RADIUS = VIEWBOX_SIZE * 0.12;
const OUTER_RADIUS = VIEWBOX_SIZE * 0.46;

type StarPoint = GalaxyLicense & {
  x: number;
  y: number;
  r: number;
  color: string;
};

/**
 * Simple deterministic hash → [0, 1)
 */
function hashToUnit(seed: string | number): number {
  const s = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function transparencyColor(score?: number | null): string {
  const t = Math.max(
    0,
    Math.min(1, (score ?? 50) / 100) // default mid if undefined
  );
  // Blend between slate (low) and emerald (high)
  const startHue = 215; // bluish-slate
  const endHue = 150; // emerald
  const hue = startHue + (endHue - startHue) * t;
  const lightness = 52 + 10 * t;
  return `hsl(${hue} 80% ${lightness}%)`;
}

function buildPoints(licenses: GalaxyLicense[]): StarPoint[] {
  if (!licenses.length) return [];

  return licenses.map((lic) => {
    const h = hashToUnit(lic.id);
    const angle = h * Math.PI * 2;
    const score = lic.transparencyScore ?? 50;
    const t = Math.max(0, Math.min(1, score / 100));

    const radius = INNER_RADIUS + t * (OUTER_RADIUS - INNER_RADIUS);
    const jitter = (hashToUnit(lic.id + "_j") - 0.5) * (VIEWBOX_SIZE * 0.03);

    const x = CENTER + Math.cos(angle) * radius + jitter;
    const y = CENTER + Math.sin(angle) * radius + jitter;

    const r = 2 + 2.5 * t; // brighter score → larger point
    const color = transparencyColor(score);

    return { ...lic, x, y, r, color };
  });
}

const GalaxyScene: React.FC<Props> = ({ licenses }) => {
  const points = React.useMemo(() => buildPoints(licenses), [licenses]);
  const [hovered, setHovered] = React.useState<StarPoint | null>(null);

  return (
    <div className="relative mt-6 h-[520px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.32)]">
      {/* soft color glows */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(45,212,191,0.2), transparent 60%), radial-gradient(circle at 80% 80%, rgba(56,189,248,0.28), transparent 55%)",
        }}
      />

      {/* subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.3)_0,transparent_60%)] opacity-40" />

      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="relative z-10 h-full w-full"
        onMouseLeave={() => setHovered(null)}
      >
        {/* rings */}
        {[0.2, 0.34, 0.48].map((t, idx) => (
          <circle
            key={idx}
            cx={CENTER}
            cy={CENTER}
            r={INNER_RADIUS + t * (OUTER_RADIUS - INNER_RADIUS)}
            fill="none"
            stroke="rgba(148,163,184,0.2)"
            strokeDasharray="3 6"
          />
        ))}

        {/* core glow */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS * 0.7}
          fill="url(#coreGradient)"
          opacity={0.8}
        />

        <defs>
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* stars */}
        {points.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.color}
            fillOpacity={0.9}
            className="transition-transform duration-150 ease-out hover:scale-[1.9]"
            onMouseEnter={() => setHovered(p)}
          />
        ))}
      </svg>

      {/* hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 max-w-xs rounded-xl border border-emerald-500/40 bg-slate-950/95 px-3 py-2 text-xs shadow-xl"
          style={{
            left: `calc(${(hovered.x / VIEWBOX_SIZE) * 100}% + 10px)`,
            top: `calc(${(hovered.y / VIEWBOX_SIZE) * 100}% + 10px)`,
          }}
        >
          <div className="font-medium text-emerald-300">
            {hovered.entityName || "Unlabelled license"}
          </div>
          <div className="text-[0.7rem] text-slate-400">
            {hovered.stateCode || "Unknown jurisdiction"}
          </div>
          <div className="mt-1 text-[0.68rem] text-slate-500">
            Transparency score:{" "}
            {hovered.transparencyScore != null
              ? hovered.transparencyScore.toFixed(1)
              : "—"}
          </div>
        </div>
      )}

      {/* footer legend */}
      <div className="pointer-events-none absolute inset-x-5 bottom-4 z-10 flex items-center justify-between text-[0.7rem] text-slate-400">
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            High transparency
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-500" />
            Low transparency
          </span>
        </span>
        <span>
          {licenses.length
            ? `${licenses.length} licenses mapped`
            : "No license data loaded yet"}
        </span>
      </div>
    </div>
  );
};

export default GalaxyScene;
