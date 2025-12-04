// src/components/galaxy/Scene.tsx
import React from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { GalaxyLicense } from "./GalaxyScene";

export interface GalaxyNode {
  license: GalaxyLicense;
  position: [number, number, number];
}

interface SceneProps {
  nodes: GalaxyNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const Scene: React.FC<SceneProps> = ({ nodes, selectedId, onSelect }) => {
  return (
    <>
      {nodes.map(({ license, position }) => {
        const isSelected = selectedId === license.id;
        const baseSize = 1.2 + license.transparencyScore * 0.4;
        const scale = isSelected ? baseSize * 1.4 : baseSize;

        const handleClick = (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelect(isSelected ? null : license.id);
        };

        return (
          <mesh
            key={license.id}
            position={position}
            onClick={handleClick}
            scale={[scale, scale, scale]}
          >
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              emissive={"white"}
              emissiveIntensity={0.5 + license.transparencyScore * 0.5}
            />
          </mesh>
        );
      })}
    </>
  );
};

export default Scene;
