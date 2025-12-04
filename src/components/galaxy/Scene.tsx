"use client";

import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGalaxyLayout } from "../../hooks/useGalaxyLayout";
import {
  useGalaxyStore,
  License,
} from "../../store/galaxyStore";

interface SceneProps {
  licenses: License[];
}

export const Scene: React.FC<SceneProps> = ({ licenses }) => {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = useGalaxyLayout(licenses);
  const select = useGalaxyStore((s) => s.select);
  const selectedId = useGalaxyStore((s) => s.selectedId);

  // Keep the store in sync so HUD can read selected node details
  useEffect(() => {
    const { setLicenses } = useGalaxyStore.getState();
    setLicenses(licenses);
  }, [licenses]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node) => {
        const isSelected = node.id === selectedId;
        const scale = isSelected ? 1.3 : 1;
        const color = isSelected
          ? "#ffcc00"
          : node.transparencyScore && node.transparencyScore > 0.66
          ? "#00ff99"
          : node.transparencyScore && node.transparencyScore > 0.33
          ? "#00aaff"
          : "#8888ff";

        return (
          <mesh
            key={node.id}
            position={node.position}
            scale={scale}
            onClick={(e) => {
              e.stopPropagation();
              select(node.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "default";
            }}
          >
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
};
