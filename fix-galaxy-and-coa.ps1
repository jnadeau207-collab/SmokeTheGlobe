Param(
  [string]$Root = "."
)

$ErrorActionPreference = "Stop"

Write-Host "== Fixing Galaxy scene, admin licenses, and COA registry =="

$rootPath = Resolve-Path $Root

$galaxyAppDir   = Join-Path $rootPath "src\app\galaxy"
$galaxyCompDir  = Join-Path $rootPath "src\components\galaxy"
$coaDir         = Join-Path $rootPath "lib\coaParsers"

New-Item $galaxyAppDir  -ItemType Directory -Force | Out-Null
New-Item $galaxyCompDir -ItemType Directory -Force | Out-Null
New-Item $coaDir        -ItemType Directory -Force | Out-Null

# 1) src/components/galaxy/GalaxyScene.tsx
$galaxyScenePath = Join-Path $galaxyCompDir "GalaxyScene.tsx"
$galaxySceneContent = @'
"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";

export type GalaxyLicense = {
  id: number | string;
  entityName?: string | null;
  stateCode?: string | null;
  transparencyScore?: number | null;
};

type GalaxySceneProps = {
  licenses: GalaxyLicense[];
};

const GalaxyScene: React.FC<GalaxySceneProps> = ({ licenses }) => {
  return (
    <div className="relative h-[calc(100vh-80px)] w-full bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      <Canvas camera={{ position: [0, 0, 18], fov: 55 }}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 10, 40]} />
        <Scene licenses={licenses} />
      </Canvas>
    </div>
  );
};

export default GalaxyScene;
'@
Set-Content -Path $galaxyScenePath -Value $galaxySceneContent -Encoding utf8
Write-Host "Updated $galaxyScenePath"

# 2) src/components/galaxy/Scene.tsx
$scenePath = Join-Path $galaxyCompDir "Scene.tsx"
$sceneContent = @'
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
'@
Set-Content -Path $scenePath -Value $sceneContent -Encoding utf8
Write-Host "Updated $scenePath"

# 3) src/app/galaxy/page.tsx
$galaxyPagePath = Join-Path $galaxyAppDir "page.tsx"
$galaxyPageContent = @'
import GalaxyScene, {
  type GalaxyLicense,
} from "@/components/galaxy/GalaxyScene";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GalaxyPage() {
  let licenses: GalaxyLicense[] = [];
  let dbError = "";

  try {
    const raw = await prisma.stateLicense.findMany({
      select: {
        id: true,
        entityName: true,
        stateCode: true,
        transparencyScore: true,
      },
      take: 1500,
    });

    licenses = raw.map((row) => ({
      id: row.id,
      entityName: row.entityName,
      stateCode: row.stateCode,
      transparencyScore: row.transparencyScore,
    }));
  } catch (err: any) {
    console.error("Failed to load licenses for galaxy view", err);
    dbError =
      "Unable to reach the database. Showing an empty galaxy until Postgres is running.";
  }

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
          Cannabis Transparency Galaxy
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Explore licensed operators as a living starfield.
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Each point of light represents a state license. Transparency scores
          influence position, color, and intensity, turning public compliance
          data into an immersive map.
        </p>
        {dbError && (
          <p className="mt-1 text-xs text-amber-400">
            {dbError} Make sure your{" "}
            <code className="font-mono">cartfax-dev</code> Postgres database is
            listening on <code className="font-mono">localhost:5432</code> and
            that <code className="font-mono">DATABASE_URL</code> is configured.
          </p>
        )}
      </section>

      <GalaxyScene licenses={licenses} />
    </main>
  );
}
'@
Set-Content -Path $galaxyPagePath -Value $galaxyPageContent -Encoding utf8
Write-Host "Updated $galaxyPagePath"

# 4) lib/coaParsers/registry.ts (stub)
$coaRegistryPath = Join-Path $coaDir "registry.ts"
$coaRegistryContent = @'
/**
 * Temporary COA parser registry stub for local development.
 * The real implementation should route to lab / jurisdiction-specific parsers.
 */

export interface ParsedCoaResult {
  labName?: string | null;
  productName?: string | null;
  lotNumber?: string | null;
  rawText?: string;
  [key: string]: unknown;
}

// Keep the signature very relaxed so whatever the API route passes will compile.
export async function parseCoa(file: any, options?: any): Promise<ParsedCoaResult> {
  return {
    ...(typeof options === "object" ? options : {}),
    rawText: "",
  };
}
'@
Set-Content -Path $coaRegistryPath -Value $coaRegistryContent -Encoding utf8
Write-Host "Created stub $coaRegistryPath"

Write-Host "`nDone. Now run: npm run dev -- --webpack"
