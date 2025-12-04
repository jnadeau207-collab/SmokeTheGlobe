// src/components/galaxy/GalaxyScene.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Scene from "@/components/galaxy/Scene";

export type GalaxyLicense = {
  id: string;
  entityName: string;
  stateCode: string;
  transparencyScore: number;
};

interface Props {
  licenses: GalaxyLicense[];
}

export default function GalaxyScene({ licenses }: Props) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 36], fov: 55 }}
        dpr={[1, 2]}
        className="h-full w-full"
      >
        <Suspense fallback={null}>
          <Scene licenses={licenses} />
        </Suspense>
      </Canvas>
    </div>
  );
}
