'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

import { useGalaxyLayout, PositionedLicense } from '@/hooks/useGalaxyLayout';
import { useGalaxyStore } from '@/store/galaxyStore';

export interface SceneLicense {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number | null;
}

interface SceneProps {
  licenses: SceneLicense[];
}

interface LicenseNodeProps {
  node: PositionedLicense;
}

const LicenseNode: React.FC<LicenseNodeProps> = ({ node }) => {
  const meshRef = useRef<Mesh | null>(null);
  const setSelectedLicense = useGalaxyStore((s) => s.setSelectedLicense);

  const score = node.transparencyScore ?? 0;
  const radius = 0.6 + score * 0.8;

  // Simple red→green gradient based on transparency score
  const r = Math.round((1 - score) * 255);
  const g = Math.round(score * 255);
  const color = `rgb(${r},${g},160)`;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedLicense({
          id: node.id,
          name: node.name,
          jurisdiction: node.jurisdiction,
          transparencyScore: node.transparencyScore ?? null,
        });
      }}
    >
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ licenses }) => {
  const nodes = useGalaxyLayout(licenses);

  return (
    <group>
      {nodes.map((node) => (
        <LicenseNode key={node.id} node={node} />
      ))}
    </group>
  );
};
