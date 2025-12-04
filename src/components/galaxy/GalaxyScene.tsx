"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";

export type GalaxyLicense = {
  id: number | string;
  entityName?: string | null;
  stateCode?: string | null;
  transparencyScore?: number | null;
};

type GalaxySceneProps = {
  licenses: GalaxyLicense[];
};

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  return (
    <div className="relative h-[calc(100vh-80px)] w-full bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      <Canvas camera={{ position: [0, 0, 18], fov: 55 }}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 10, 40]} />
        <Scene licenses={licenses} />
      </Canvas>
    </div>
  );
};

export default GalaxyScene;
