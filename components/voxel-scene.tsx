"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { Color, Group, InstancedMesh, Matrix4, Object3D } from "three";
import { COLOR_OPTIONS, type PaletteKey, type Voxel, type VoxelDraft } from "@/lib/site-data";
import type { PerformanceTier } from "@/hooks/use-performance-tier";

type PointerState = {
  x: number;
  y: number;
  normX: number;
  normY: number;
};

type VoxelSceneProps = {
  voxels: Voxel[];
  preview: VoxelDraft | null;
  magnetic: VoxelDraft | null;
  gridCols: number;
  gridRows: number;
  pointerRef: React.MutableRefObject<PointerState>;
  tier: PerformanceTier;
  interactiveEnabled: boolean;
};

const tempObject = new Object3D();
const tempMatrix = new Matrix4();

function InstancedVoxels({
  voxels,
  gridCols,
  gridRows,
  opacity = 1
}: {
  voxels: Array<Voxel | VoxelDraft>;
  gridCols: number;
  gridRows: number;
  opacity?: number;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const colors = useMemo(() => voxels.map((voxel) => new Color(COLOR_OPTIONS[voxel.colorKey].hex)), [voxels]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    voxels.forEach((voxel, index) => {
      tempObject.position.set(
        voxel.x + voxel.w / 2 - gridCols / 2,
        voxel.z + 0.5,
        voxel.y + voxel.h / 2 - gridRows / 2
      );
      tempObject.scale.set(voxel.w * 0.96, 0.96, voxel.h * 0.96);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
      mesh.setColorAt(index, colors[index]);
    });

    mesh.count = voxels.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [voxels, colors, gridCols, gridRows]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(voxels.length, 1)]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.92}
        metalness={0.04}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function SceneRig({
  pointerRef,
  interactiveEnabled,
  children
}: {
  pointerRef: React.MutableRefObject<PointerState>;
  interactiveEnabled: boolean;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const targetX = interactiveEnabled ? pointerRef.current.normY * -0.32 : 0;
    const targetY = interactiveEnabled ? pointerRef.current.normX * 0.32 : 0;
    group.rotation.x += (targetX - group.rotation.x) * 0.08;
    group.rotation.y += (targetY - group.rotation.y) * 0.08;
  });

  return <group ref={groupRef}>{children}</group>;
}

export function VoxelScene({
  voxels,
  preview,
  magnetic,
  gridCols,
  gridRows,
  pointerRef,
  tier,
  interactiveEnabled
}: VoxelSceneProps) {
  const previewVoxels = preview ? [preview] : [];
  const magneticVoxels = !preview && magnetic ? [magnetic] : [];
  const gridSize = Math.max(gridCols, gridRows);

  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, tier === "low" ? 1 : tier === "medium" ? 1.25 : 1.5]}
      gl={{ alpha: true, antialias: tier !== "low", powerPreference: "high-performance" }}
      camera={{ position: [0, 18, 24], fov: 34, near: 0.1, far: 200 }}
    >
      {tier !== "low" && <AdaptiveDpr pixelated />}
      {tier === "low" && <AdaptiveEvents />}
      <ambientLight intensity={1.15} />
      <directionalLight position={[12, 18, 8]} intensity={1.25} />
      <directionalLight position={[-10, 8, -14]} intensity={0.38} />

      <SceneRig pointerRef={pointerRef} interactiveEnabled={interactiveEnabled}>
        <group position={[0, -1.5, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
            <planeGeometry args={[gridCols, gridRows]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {gridSize > 0 && (
            <gridHelper
              args={[gridSize, gridSize, "#9f9a92", "#c8c4ca"]}
              position={[0, -0.49, 0]}
            />
          )}

          {!!voxels.length && <InstancedVoxels voxels={voxels} gridCols={gridCols} gridRows={gridRows} />}
          {!!magneticVoxels.length && (
            <InstancedVoxels voxels={magneticVoxels} gridCols={gridCols} gridRows={gridRows} opacity={0.18} />
          )}
          {!!previewVoxels.length && (
            <InstancedVoxels voxels={previewVoxels} gridCols={gridCols} gridRows={gridRows} opacity={0.34} />
          )}
        </group>
      </SceneRig>
    </Canvas>
  );
}
