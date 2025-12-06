# scripts/step7-galaxy-setup.ps1
# Step 7 - Add Galaxy Visualization UI Powered by License Data

$ErrorActionPreference = "Stop"

Write-Host "== Step 7: Galaxy visualization setup ==" -ForegroundColor Cyan

# 1) Ensure we're in the project root
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Run this script from the project root (SmokeTheGlobe)." -ForegroundColor Red
    exit 1
}

# 2) Install dependencies
Write-Host "Installing React Three Fiber + Drei + Three + Zustand..." -ForegroundColor Cyan
npm install @react-three/fiber@^8 @react-three/drei@^8 three@^0.144 zustand@^4

# 3) Ensure directories exist
Write-Host "Ensuring directories exist..." -ForegroundColor Cyan
$dirs = @(
    "src/store",
    "src/hooks",
    "src/components/galaxy",
    "src/app/galaxy"
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d | Out-Null
        Write-Host "  Created $d"
    }
}

# 4) Optional backups of existing galaxy files (if they exist)
$backupTargets = @(
    "src/store/galaxyStore.ts",
    "src/hooks/useGalaxyLayout.ts",
    "src/components/galaxy/Scene.tsx",
    "src/components/galaxy/HUD.tsx"
)
foreach ($target in $backupTargets) {
    if (Test-Path $target) {
        $backup = "$target.bak"
        if (-not (Test-Path $backup)) {
            Copy-Item $target $backup
            Write-Host "  Backed up $target -> $backup" -ForegroundColor Yellow
        }
    }
}

# 5) Write new galaxyStore.ts
Write-Host "Writing src/store/galaxyStore.ts..." -ForegroundColor Cyan
$galaxyStoreContent = @'
import { create } from "zustand";

export type LicenseNode = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
  position: [number, number, number];
};

export type GalaxyState = {
  nodes: LicenseNode[];
  selectedId?: string;
  setNodes: (nodes: LicenseNode[]) => void;
  selectNode: (id?: string) => void;
};

export const useGalaxyStore = create<GalaxyState>((set) => ({
  nodes: [],
  selectedId: undefined,
  setNodes: (nodes) => set({ nodes }),
  selectNode: (id) => set({ selectedId: id }),
}));
'@
Set-Content -Path "src/store/galaxyStore.ts" -Value $galaxyStoreContent -Encoding UTF8

# 6) Write new useGalaxyLayout.ts
Write-Host "Writing src/hooks/useGalaxyLayout.ts..." -ForegroundColor Cyan
$useGalaxyLayoutContent = @'
import { useMemo } from "react";
import type { LicenseNode } from "@/store/galaxyStore";

export type LicenseInput = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
};

export function useGalaxyLayout(licenses: LicenseInput[]): LicenseNode[] {
  return useMemo(() => {
    if (!licenses || licenses.length === 0) {
      return [];
    }

    const radius = 60;
    const verticalSpread = 40;
    const count = licenses.length;

    return licenses.map((license, index) => {
      const angle = (index / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = ((index / count) - 0.5) * verticalSpread;

      return {
        ...license,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, [licenses]);
}
'@
Set-Content -Path "src/hooks/useGalaxyLayout.ts" -Value $useGalaxyLayoutContent -Encoding UTF8

# 7) Write new Scene.tsx
Write-Host "Writing src/components/galaxy/Scene.tsx..." -ForegroundColor Cyan
$sceneContent = @'
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
'@
Set-Content -Path "src/components/galaxy/Scene.tsx" -Value $sceneContent -Encoding UTF8

# 8) Write new HUD.tsx
Write-Host "Writing src/components/galaxy/HUD.tsx..." -ForegroundColor Cyan
$hudContent = @'
"use client";

import React from "react";
import { useGalaxyStore } from "@/store/galaxyStore";

const HUD: React.FC = () => {
  const nodes = useGalaxyStore((s) => s.nodes);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const selected = nodes.find((n) => n.id === selectedId);

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        padding: "12px 16px",
        borderRadius: 8,
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        maxWidth: 360,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 12, textTransform: "uppercase", opacity: 0.7 }}>
        Supply Chain Galaxy
      </div>
      {selected ? (
        <>
          <div style={{ marginTop: 4, fontSize: 16, fontWeight: 600 }}>
            {selected.name || "Unknown license"}
          </div>
          <div style={{ marginTop: 2, fontSize: 12, opacity: 0.9 }}>
            {selected.jurisdiction || "Unknown jurisdiction"}
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            Transparency score:{" "}
            <strong>
              {typeof selected.transparencyScore === "number"
                ? selected.transparencyScore.toFixed(2)
                : "n/a"}
            </strong>{" "}
            <span style={{ opacity: 0.7 }}>(experimental metric)</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
            Tip: click a different node to change focus, or click empty space to clear selection.
          </div>
        </>
      ) : (
        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
          Click a node in the galaxy to inspect its license details.
        </div>
      )}
    </div>
  );
};

export default HUD;
'@
Set-Content -Path "src/components/galaxy/HUD.tsx" -Value $hudContent -Encoding UTF8

# 9) Write new GalaxyScene.tsx
Write-Host "Writing src/components/galaxy/GalaxyScene.tsx..." -ForegroundColor Cyan
$galaxySceneContent = @'
"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Scene } from "./Scene";
import HUD from "./HUD";
import { useGalaxyLayout } from "@/hooks/useGalaxyLayout";

export type GalaxyLicense = {
  id: string;
  name: string;
  jurisdiction?: string;
  transparencyScore?: number;
};

type GalaxySceneProps = {
  licenses: GalaxyLicense[];
};

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  const nodes = useGalaxyLayout(licenses);

  return (
    <div style={{ width: "100%", height: "100vh", background: "black" }}>
      <Canvas camera={{ position: [0, 0, 120], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[30, 30, 30]} intensity={1.2} />
        <Stars radius={200} depth={50} count={2000} factor={4} fade />
        <Scene licenses={nodes} />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
      <HUD />
    </div>
  );
};

export default GalaxyScene;
'@
Set-Content -Path "src/components/galaxy/GalaxyScene.tsx" -Value $galaxySceneContent -Encoding UTF8

# 10) Write new /galaxy page
Write-Host "Writing src/app/galaxy/page.tsx..." -ForegroundColor Cyan
$pageContent = @'
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import GalaxyScene, { GalaxyLicense } from "@/components/galaxy/GalaxyScene";

export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  const licenses = await prisma.stateLicense.findMany({
    select: {
      id: true,
      entityName: true,
      stateCode: true,
      transparencyScore: true,
    },
    orderBy: { id: "asc" },
  });

  const licenseData: GalaxyLicense[] = licenses.map((l) => ({
    id: String(l.id),
    name: l.entityName ?? `License ${l.id}`,
    jurisdiction: l.stateCode ?? "",
    transparencyScore:
      typeof l.transparencyScore === "number" ? l.transparencyScore : 0,
  }));

  return (
    <div className="w-full h-screen">
      <Suspense fallback={<p className="p-4 text-sm text-gray-400">Loading 3D visualization...</p>}>
        <GalaxyScene licenses={licenseData} />
      </Suspense>
    </div>
  );
}
'@
Set-Content -Path "src/app/galaxy/page.tsx" -Value $pageContent -Encoding UTF8

Write-Host ""
Write-Host "✅ Step 7 complete." -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Green
Write-Host "Then open http://localhost:3000/galaxy in your browser to see the galaxy visualization." -ForegroundColor Cyan
