"use client";

import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Scene } from "./Scene";
import HUD from "./HUD";
import {
  useGalaxyStore,
  License,
} from "../../store/galaxyStore";

interface GalaxySceneProps {
  licenses: License[];
}

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  const setLicenses = useGalaxyStore((s) => s.setLicenses);

  // Seed the store so HUD has access to the same data
  useEffect(() => {
    setLicenses(licenses);
  }, [licenses, setLicenses]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        margin: 0,
        padding: 0,
      }}
    >
      <Canvas camera={{ position: [0, 0, 80], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[30, 30, 30]} intensity={0.8} />
        <Scene licenses={licenses} />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
      <HUD />
    </div>
  );
};

export default GalaxyScene;
