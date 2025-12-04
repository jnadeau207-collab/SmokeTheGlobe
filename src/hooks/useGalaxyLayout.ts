import { useMemo } from "react";
import type { LicenseNode } from "@/store/galaxyStore";

export type LicenseInput = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
};

export function useGalaxyLayout(licenses: LicenseInput[]): LicenseNode[] {
  return useMemo(() => {
    if (!licenses || licenses.length === 0) {
      return [];
    }

    const radius = 60;
    const verticalSpread = 40;
    const count = licenses.length;

    return licenses.map((license, index) => {
      const angle = (index / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = ((index / count) - 0.5) * verticalSpread;

      return {
        ...license,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, [licenses]);
}
