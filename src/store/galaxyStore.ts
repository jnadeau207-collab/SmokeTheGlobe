import { create } from "zustand";

export type LicenseNode = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
  position: [number, number, number];
};

export type GalaxyState = {
  nodes: LicenseNode[];
  selectedId?: string;
  setNodes: (nodes: LicenseNode[]) => void;
  selectNode: (id?: string) => void;
};

export const useGalaxyStore = create<GalaxyState>((set) => ({
  nodes: [],
  selectedId: undefined,
  setNodes: (nodes) => set({ nodes }),
  selectNode: (id) => set({ selectedId: id }),
}));
