// src/components/galaxy/GalaxyScene.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import HUD from "./HUD";

export interface GalaxyLicense {
  id: string;
  name: string;
  jurisdiction: string;
  transparencyScore: number;
}

interface GalaxySceneProps {
  licenses: GalaxyLicense[];
}

interface PositionedNode {
  license: GalaxyLicense;
  position: [number, number, number];
}

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Very simple radial layout: place licenses around a circle,
  // with radius slightly influenced by transparencyScore
  const nodes: PositionedNode[] = useMemo(() => {
    const count = Math.max(licenses.length, 1);

    return licenses.map((license, index) => {
      const angle = (index / count) * Math.PI * 2;
      const radius = 30 + license.transparencyScore * 10;

      const position: [number, number, number] = [
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        0,
      ];

      return { license, position };
    });
  }, [licenses]);

  const selectedLicense =
    nodes.find((n) => n.license.id === selectedId)?.license ?? null;

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <Canvas camera={{ position: [0, 0, 120], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[50, 50, 50]} />
        <Scene
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </Canvas>
      <HUD selected={selectedLicense} />
    </div>
  );
};

export default GalaxyScene;
