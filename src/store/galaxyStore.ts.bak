// src/store/galaxyStore.ts
import { create } from 'zustand';

type License = {
  id: string;
  name: string;
  type: string;
  region: string;
  status?: string;
};

type GalaxyState = {
  selectedLicense: License | null;
  hoveredLicenseId: number | null;
  setSelectedLicense: (lic: License | null) => void;
  setHoveredLicenseId: (id: number | null) => void;
};

export const useGalaxyStore = create<GalaxyState>((set) => ({
  selectedLicense: null,
  hoveredLicenseId: null,
  setSelectedLicense: (selectedLicense) => set({ selectedLicense }),
  setHoveredLicenseId: (hoveredLicenseId) => set({ hoveredLicenseId }),
}));
