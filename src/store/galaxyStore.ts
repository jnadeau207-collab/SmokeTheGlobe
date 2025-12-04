"use client";

import { create } from "zustand";

export interface License {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
}

export interface PositionedLicense extends License {
  position: [number, number, number];
}

interface GalaxyState {
  nodes: PositionedLicense[];
  selectedId: string | null;
  setLicenses: (licenses: License[]) => void;
  select: (id: string | null) => void;
}

/**
 * Pure layout function – can also be used from hooks.
 */
export function computeGalaxyLayout(
  licenses: License[]
): PositionedLicense[] {
  const count = licenses.length || 1;
  const angleStep = (2 * Math.PI) / count;
  const baseRadius = 30;

  return licenses.map((lic, index) => {
    const angle = index * angleStep;
    const score = lic.transparencyScore ?? 0.5;
    const radius = baseRadius + score * 10;

    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = (score - 0.5) * 10;

    return {
      ...lic,
      position: [x, y, z],
    };
  });
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  nodes: [],
  selectedId: null,
  setLicenses: (licenses) =>
    set({
      nodes: computeGalaxyLayout(licenses),
      selectedId: null,
    }),
  select: (id) => set({ selectedId: id }),
}));
