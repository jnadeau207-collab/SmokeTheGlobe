"use client";

import React, { useMemo } from "react";
import { Color } from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGalaxyStore } from "@/store/galaxyStore";

type SceneProps = {
  licenses: {
    id: string;
    name: string;
    jurisdiction?: string;
    transparencyScore?: number;
    position: [number, number, number];
  }[];
};

type NodeProps = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
  position: [number, number, number];
};

const LicenseNode: React.FC<NodeProps> = ({
  id,
  name,
  jurisdiction,
  transparencyScore,
  position,
}) => {
  const selectNode = useGalaxyStore((s) => s.selectNode);
  const selectedId = useGalaxyStore((s) => s.selectedId);

  const isSelected = selectedId === id;

  const color = useMemo(() => {
    const t = typeof transparencyScore === "number" ? transparencyScore : 0;
    const clamped = Math.max(0, Math.min(1, t));
    // Green-ish for high transparency, red-ish for low
    const start = new Color("#ff4b4b");
    const end = new Color("#4bff7a");
    return start.lerp(end, clamped);
  }, [transparencyScore]);

  const scale = isSelected ? 1.6 : 1.0;

  return (
    <group position={position}>
      <mesh
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          selectNode(isSelected ? undefined : id);
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {isSelected && (
        <Html distanceFactor={8}>
          <div
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              fontSize: "10px",
              whiteSpace: "nowrap",
            }}
          >
            <div>{name}</div>
            {jurisdiction && <div style={{ opacity: 0.8 }}>{jurisdiction}</div>}
          </div>
        </Html>
      )}
    </group>
  );
};

export const Scene: React.FC<SceneProps> = ({ licenses }) => {
  const setNodes = useGalaxyStore((s) => s.setNodes);

  // Keep Zustand store in sync (for HUD)
  useMemo(() => {
    setNodes(
      licenses.map((l) => ({
        id: l.id,
        name: l.name,
        jurisdiction: l.jurisdiction,
        transparencyScore: l.transparencyScore,
        position: l.position,
      }))
    );
  }, [licenses, setNodes]);

  const groupRef = React.useRef<THREE.Group>(null!);

  // Slow rotation of whole galaxy
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {licenses.map((license) => (
        <LicenseNode key={license.id} {...license} />
      ))}
    </group>
  );
};
