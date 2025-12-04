"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Scene } from "./Scene";
import HUD from "./HUD";
import { useGalaxyLayout } from "@/hooks/useGalaxyLayout";

export type GalaxyLicense = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
};

type GalaxySceneProps = {
  licenses: GalaxyLicense[];
};

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  const nodes = useGalaxyLayout(licenses);

  return (
    <div style={{ width: "100%", height: "100vh", background: "black" }}>
      <Canvas camera={{ position: [0, 0, 120], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[30, 30, 30]} intensity={1.2} />
        <Stars radius={200} depth={50} count={2000} factor={4} fade />
        <Scene licenses={nodes} />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
      <HUD />
    </div>
  );
};

export default GalaxyScene;
