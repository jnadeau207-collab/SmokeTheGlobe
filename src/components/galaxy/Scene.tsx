"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GalaxyLicense } from "./GalaxyScene";

type SceneProps = {
  licenses: GalaxyLicense[];
};

const LicenseStar: React.FC<{
  license: GalaxyLicense;
  index: number;
  total: number;
}> = ({ license, index, total }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const [radius, angle, baseY] = useMemo(() => {
    const t = (license.transparencyScore ?? 50) / 100;
    const r = 4 + t * 10;
    const theta = (index / Math.max(total, 1)) * Math.PI * 2;
    const y = (t - 0.5) * 6;
    return [r, theta, y];
  }, [license.transparencyScore, index, total]);

  const color = useMemo(() => {
    const t = (license.transparencyScore ?? 50) / 100;
    const emerald = new THREE.Color("#22c55e");
    const dim = new THREE.Color("#0f172a");
    return dim.lerp(emerald, t).getStyle();
  }, [license.transparencyScore]);

  const position = useMemo<[number, number, number]>(() => {
    return [Math.cos(angle) * radius, baseY, Math.sin(angle) * radius];
  }, [angle, radius, baseY]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.15;
    meshRef.current.position.y = baseY + Math.sin(t + index) * 0.25;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.14, 24, 24]} />
      <meshStandardMaterial
        emissive={color}
        emissiveIntensity={1.4}
        toneMapped={false}
      />
    </mesh>
  );
};

const Scene: React.FC<SceneProps> = ({ licenses }) => {
  const safeLicenses = licenses ?? [];

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 6, 4]} intensity={1.4} />
      <pointLight position={[-6, -6, -4]} intensity={0.4} />

      <group rotation={[0.35, 0.5, 0]}>
        {safeLicenses.map((license, index) => (
          <LicenseStar
            key={license.id}
            license={license}
            index={index}
            total={safeLicenses.length || 1}
          />
        ))}
      </group>
    </>
  );
};

export default Scene;
