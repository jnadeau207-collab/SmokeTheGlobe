// src/components/galaxy/Scene.tsx
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GalaxyLicense } from "./GalaxyScene";

interface SceneProps {
  licenses: GalaxyLicense[];
}

interface Point {
  id: string;
  position: [number, number, number];
  color: string;
}

function LicensePoint({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

const Scene: React.FC<SceneProps> = ({ licenses }) => {
  const points = useMemo<Point[]>(() => {
    // If we have no data yet, show a single placeholder node
    if (!licenses.length) {
      return [
        {
          id: "placeholder",
          position: [0, 0, 0],
          color: "#46c2a1",
        },
      ];
    }

    const radius = 25;

    return licenses.map((lic, index) => {
      const angle = (index / Math.max(licenses.length, 1)) * Math.PI * 2;
      const y = ((index % 10) - 5) * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const score = lic.transparencyScore ?? 0;
      const clamped = Math.min(Math.max(score, 0), 1);
      const green = Math.floor(120 + clamped * 120);
      const red = Math.floor(255 - clamped * 120);
      const color = `rgb(${red},${green},200)`;

      return {
        id: lic.id,
        position: [x, y, z],
        color,
      };
    });
  }, [licenses]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[40, 40, 40]} intensity={1.4} />
      {points.map((p) => (
        <LicensePoint key={p.id} position={p.position} color={p.color} />
      ))}
    </>
  );
};

export default Scene;
