'use client';

import { useMemo } from 'react';
import type { GalaxyLicense } from '@/store/galaxyStore';

export type PositionedLicense = GalaxyLicense & {
  position: [number, number, number];
};

export function useGalaxyLayout(licenses: GalaxyLicense[]): PositionedLicense[] {
  return useMemo(() => {
    const count = licenses.length;
    if (count === 0) return [];

    const radius = 40;

    return licenses.map((license, index) => {
      const angle = (index / count) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = (Math.random() - 0.5) * 20;

      return {
        ...license,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, [licenses]);
}
