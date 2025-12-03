// hooks/useGalaxyLayout.ts
import { useMemo } from 'react';

type License = {
  id: string;
  region?: string;
  coord_x?: number;
  coord_y?: number;
  coord_z?: number;
};

interface LayoutResult {
  positions: Float32Array;
  regions?: Record<string, { center: [number, number, number] }>;
}

export function useGalaxyLayout(licenses: License[]): LayoutResult {
  return useMemo(() => {
    const count = licenses.length;
    const positions = new Float32Array(count * 3);

    if (count === 0) {
      return { positions };
    }

    const first = licenses[0];
    if (first.coord_x !== undefined) {
      licenses.forEach((lic, i) => {
        positions[i * 3] = lic.coord_x as number;
        positions[i * 3 + 1] = lic.coord_y as number;
        positions[i * 3 + 2] = lic.coord_z as number;
      });
      return { positions };
    }

    const regions = new Map<string, Array<number>>();
    licenses.forEach((lic, i) => {
      const region = lic.region || 'Unknown';
      if (!regions.has(region)) {
        regions.set(region, []);
      }
      regions.get(region)!.push(i);
    });

    const regionCount = regions.size;
    const regionRadius = 100;
    const angleStep = (2 * Math.PI) / regionCount;
    const regionCenters: Record<string, { center: [number, number, number] }> = {};
    let index = 0;
    regions.forEach((indices, region) => {
      const angle = index * angleStep;
      const centerX = regionRadius * Math.cos(angle);
      const centerY = 0;
      const centerZ = regionRadius * Math.sin(angle);
      regionCenters[region] = { center: [centerX, centerY, centerZ] };

      indices.forEach((i) => {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * 2 * Math.PI;
        const radius = 10 + Math.random() * 20;
        positions[i * 3] = centerX + radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = centerY + radius * Math.cos(phi);
        positions[i * 3 + 2] = centerZ + radius * Math.sin(phi) * Math.sin(theta);
      });
      index++;
    });

    return { positions, regions: regionCenters };
  }, [licenses]);
}
