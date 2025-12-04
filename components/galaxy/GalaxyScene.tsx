// components/galaxy/GalaxyScene.tsx
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import type { GalaxyLicense } from "@/app/galaxy/page";

type Props = {
  licenses: GalaxyLicense[];
};

export default function GalaxyScene({ licenses }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 60], fov: 60 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 20, 10]} intensity={2} />

      <LicensePointCloud licenses={licenses} />
    </Canvas>
  );
}

function LicensePointCloud({ licenses }: Props) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = licenses.length;
    const posArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);

    licenses.forEach((license, i) => {
      const seed = hashToSeed(license.id);
      // pseudo-random sphere coordinates based on id
      const radius = 20 + (seed % 1000) / 80; // 20–32
      const theta = ((seed * 16807) % 314159) / 10000; // 0–~31.4
      const phi = ((seed * 48271) % 157080) / 10000; // 0–~15.7

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      posArray[i * 3 + 0] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      const scoreRaw = license.transparencyScore ?? 0;
      const score = Math.max(0, Math.min(1, scoreRaw / 100));

      // Low score -> amber; high score -> emerald
      const r = score < 0.5 ? 1 : 0.15;
      const g = 0.35 + score * 0.6;
      const b = score > 0.7 ? 1 : 0.5;

      colorArray[i * 3 + 0] = r;
      colorArray[i * 3 + 1] = g;
      colorArray[i * 3 + 2] = b;
    });

    return { positions: posArray, colors: colorArray };
  }, [licenses]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.35}
        vertexColors
        depthWrite={false}
        transparent
        opacity={0.9}
      />
    </points>
  );
}

function hashToSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
