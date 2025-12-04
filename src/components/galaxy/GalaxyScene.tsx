// src/components/galaxy/GalaxyScene.tsx
"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import HUD from "./HUD";

export interface GalaxyLicense {
  id: string;
  name: string;
  jurisdiction?: string | null;
  transparencyScore?: number | null;
}

interface GalaxySceneProps {
  licenses: GalaxyLicense[];
}

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <Canvas camera={{ position: [0, 0, 80], fov: 60 }}>
        <Scene licenses={licenses} />
      </Canvas>
      <HUD totalLicenses={licenses.length} />
    </div>
  );
};

export default GalaxyScene;
