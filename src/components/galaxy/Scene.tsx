// src/components/galaxy/Scene.tsx
import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyLayout } from '../../hooks/useGalaxyLayout';
import { useGalaxyStore } from '../../store/galaxyStore';

const LICENSE_COLORS: Record<string, THREE.ColorRepresentation> = {
  cultivator: 'green',
  retailer: 'blue',
  laboratory: 'white',
  manufacturer: 'orange',
  default: 'gray'
};

type License = {
  id: string;
  name: string;
  type: string;
  region: string;
  status?: string;
};

interface GalaxyProps {
  licenses: License[];
  edges?: [number, number][];
}

const SupplyChainGalaxy: React.FC<GalaxyProps> = ({ licenses, edges }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const highlightRef = useRef<THREE.InstancedMesh>(null);
  const { positions } = useGalaxyLayout(licenses);

  const setSelectedLicense = useGalaxyStore(state => state.setSelectedLicense);
  const setHoveredLicenseId = useGalaxyStore(state => state.setHoveredLicenseId);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    licenses.forEach((license, i) => {
      dummy.position.set(
        positions[i * 3 + 0],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const color = LICENSE_COLORS[license.type] || LICENSE_COLORS.default;
      mesh.setColorAt(i, new THREE.Color(color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [licenses, positions]);

  useFrame(() => {
    if (!highlightRef.current) return;
    const hoveredId = useGalaxyStore.getState().hoveredLicenseId;
    if (hoveredId === null) return;
    const dummy = new THREE.Object3D();
    dummy.position.set(
      positions[hoveredId * 3 + 0],
      positions[hoveredId * 3 + 1],
      positions[hoveredId * 3 + 2]
    );
    dummy.scale.set(1.5, 1.5, 1.5);
    dummy.updateMatrix();
    highlightRef.current.setMatrixAt(0, dummy.matrix);
    highlightRef.current.instanceMatrix.needsUpdate = true;
  });

  const edgesGeom = useMemo(() => {
    if (!edges || edges.length === 0) return null;
    const geom = new THREE.BufferGeometry();
    const verts: number[] = [];
    edges.forEach(([i, j]) => {
      verts.push(
        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
      );
    });
    geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return geom;
  }, [edges, positions]);

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined) {
      setHoveredLicenseId(instanceId);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHoveredLicenseId(null);
    document.body.style.cursor = 'default';
  };

  const handlePointerClick = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined) {
      const license = licenses[instanceId];
      setSelectedLicense(license);
    }
  };

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 200], fov: 50 }}>
      <OrbitControls enablePan={false} makeDefault />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 500]} intensity={0.2} />
      <Stars radius={1000} depth={500} count={10000} factor={4} saturation={0} fade speed={1} />
      <instancedMesh
        ref={meshRef}
        args={[undefined as any, undefined as any, licenses.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerClick}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={highlightRef} args={[undefined as any, undefined as any, 1]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshBasicMaterial color="yellow" transparent opacity={0.8} />
      </instancedMesh>
      {edgesGeom && (
        <lineSegments geometry={edgesGeom}>
          <lineBasicMaterial color="#888" transparent opacity={0.5} />
        </lineSegments>
      )}
    </Canvas>
  );
};

export default SupplyChainGalaxy;
