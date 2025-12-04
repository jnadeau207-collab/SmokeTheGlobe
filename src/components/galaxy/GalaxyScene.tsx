"use client";

import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Scene } from "./Scene";
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

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedLicense = useMemo(
    () => licenses.find((l) => l.id === selectedId) ?? null,
    [licenses, selectedId]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Canvas camera={{ position: [0, 0, 120], fov: 70 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[50, 50, 50]} intensity={1.2} />
        <Scene
          licenses={licenses}
          onSelectLicense={(license) => setSelectedId(license?.id ?? null)}
        />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>

      <HUD license={selectedLicense} />
    </div>
  );
};

export default GalaxyScene;
