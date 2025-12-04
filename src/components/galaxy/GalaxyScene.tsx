'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import { Scene } from './Scene';
import HUD from './HUD';

export interface GalaxySceneLicense {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number | null;
}

interface GalaxySceneProps {
  licenses: GalaxySceneLicense[];
}

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: 'black' }}>
      <Canvas camera={{ position: [0, 0, 90], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[50, 50, 50]} intensity={1.2} />
        <Scene licenses={licenses} />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
      <HUD />
    </div>
  );
};

export default GalaxyScene;
