'use client';

import { create } from 'zustand';

export type GalaxyLicense = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number | null;
};

type GalaxyStoreState = {
  selectedLicense: GalaxyLicense | null;
  setSelectedLicense: (license: GalaxyLicense | null) => void;
};

export const useGalaxyStore = create<GalaxyStoreState>((set) => ({
  selectedLicense: null,
  setSelectedLicense: (selectedLicense) => set({ selectedLicense }),
}));
