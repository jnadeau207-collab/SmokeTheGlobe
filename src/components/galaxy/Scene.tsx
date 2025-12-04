// src/components/galaxy/Scene.tsx
"use client";

import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import type { GalaxyLicense } from "@/components/galaxy/GalaxyScene";

interface Props {
  licenses: GalaxyLicense[];
}

function LicensePoints({ licenses }: Props) {
  const positions = useMemo(() => {
    const arr = new Float32Array(licenses.length * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    licenses.forEach((license, i) => {
      const score = license.transparencyScore ?? 0;
      const radius = 8 + score * 4;
      const theta = i * goldenAngle;
      const y = ((i / Math.max(licenses.length, 1)) - 0.5) * 10;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    });

    return arr;
  }, [licenses]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={licenses.length}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.35}
        sizeAttenuation
        color="#34d399"
        transparent
        opacity={0.9}
      />
    </points>
  );
}

export default function Scene({ licenses }: Props) {
  return (
    <>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[20, 20, 10]} intensity={1.2} color="#34d399" />
      <LicensePoints licenses={licenses} />
      <OrbitControls
        enablePan={false}
        enableZoom
        autoRotate
        autoRotateSpeed={0.35}
      />
    </>
  );
}
