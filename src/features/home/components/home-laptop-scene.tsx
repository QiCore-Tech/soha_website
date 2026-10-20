"use client";

import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Box3, Color, Group, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Vector3, type Object3D, type Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { expandScreenQuad, getLaptopPose, getPhonePose, laptopSegment, LAPTOP_MODEL_SCALE, LAPTOP_SHOWCASE_ZOOM, laptopEntryCameraOffset, screenFitDistance, screenProjectionMatrix, type ScreenQuad } from "../lib/home-laptop-motion";
import type { LaptopSceneProps, WorkspaceDevice } from "../lib/home-laptop-types";

export function disposeLaptopModel(model: Object3D) {
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  model.traverse(node => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value && typeof value === "object" && "isTexture" in value) textures.add(value as Texture);
      }
    }
  });
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}

export async function loadLaptopModel(device: WorkspaceDevice = "laptop") {
  const gltf = await new GLTFLoader().loadAsync(device === "phone" ? "/3D/apple_iphone_18_pro_max/scene.gltf" : "/3D/macbook_pro.glb");
  if (device === "phone") {
    const screen = gltf.scene.getObjectByName("Object_60");
    if (!(screen instanceof Mesh)) {
      disposeLaptopModel(gltf.scene);
      throw new Error("Phone model has no calibrated screen");
    }
    // Normalize the meter-scale export around its center for the shared camera.
    gltf.scene.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new Vector3());
    gltf.scene.position.sub(center);
    const model = new Group();
    model.scale.setScalar(0.24 / bounds.getSize(new Vector3()).y);
    model.add(gltf.scene);
    const old = Array.isArray(screen.material) ? screen.material : [screen.material];
    screen.material = new MeshBasicMaterial({ color: "#161718" });
    for (const material of old) {
      for (const value of Object.values(material)) {
        if (value && typeof value === "object" && "isTexture" in value) (value as Texture).dispose();
      }
      material.dispose();
    }
    return model;
  }
  const lid = gltf.scene.getObjectByName("Bevels_2");
  const screen = gltf.scene.getObjectByName("Object_7");
  if (!lid || !(screen instanceof Mesh)) {
    disposeLaptopModel(gltf.scene);
    throw new Error("Laptop model has no calibrated lid/screen");
  }
  gltf.scene.traverse(node => {
    if (!(node instanceof Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach(material => {
      if (material instanceof MeshStandardMaterial && material.name.startsWith("Space_Grey")) {
        material.color = new Color("#7c7e82");
        material.metalness = 0.65;
        material.roughness = 0.33;
      }
    });
  });
  // The exported desktop screenshot is not used: HTML is the visible display.
  const old = screen.material;
  for (const material of Array.isArray(old) ? old : [old]) {
    if (material instanceof MeshStandardMaterial) material.map?.dispose();
    material.dispose();
  }
  screen.material = new MeshBasicMaterial({ color: "#161718" });
  return gltf.scene;
}

function LaptopScene({ model, device, screenRef, stageRef, hintRef, onReady, onFailure }: LaptopSceneProps) {
  const { camera: rawCamera, size, invalidate, gl } = useThree();
  const camera = rawCamera as PerspectiveCamera;
  const rootRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const prepared = useMemo(() => {
    if (device === "phone") {
      const screen = model.getObjectByName("Object_60") as Mesh;
      screen.geometry.computeBoundingBox();
      const box = screen.geometry.boundingBox as Box3;
      const z = box.max.z + 0.000005;
      return { lid: null, screen, corners: [
        new Vector3(box.min.x, box.max.y, z), new Vector3(box.max.x, box.max.y, z),
        new Vector3(box.max.x, box.min.y, z), new Vector3(box.min.x, box.min.y, z),
      ] };
    }
    const lid = model.getObjectByName("Bevels_2")!;
    const screen = model.getObjectByName("Object_7") as Mesh;
    const label = model.getObjectByName("Macbook Pro_4");
    // The exported lid pivots at its hinge. Its label is a sibling, so retain
    // its relative hinge transform while reparenting once into the lid.
    model.updateMatrixWorld(true);
    if (label && label.parent !== lid) lid.attach(label);
    screen.geometry.computeBoundingBox();
    const box = screen.geometry.boundingBox as Box3;
    const points = screen.geometry.getAttribute("position");
    const nearest = (x: number, z: number) => {
      let candidate = new Vector3(), best = Infinity;
      for (let index = 0; index < points.count; index++) {
        const point = new Vector3().fromBufferAttribute(points, index);
        const distance = Math.abs(point.x - x) + Math.abs(point.z - z);
        if (distance < best) { best = distance; candidate = point; }
      }
      return candidate;
    };
    return { lid, screen, corners: [nearest(box.min.x, box.max.z), nearest(box.max.x, box.max.z), nearest(box.max.x, box.min.z), nearest(box.min.x, box.min.z)] };
  }, [device, model]);

  const render = useCallback((value: number) => {
    const root = rootRef.current, host = screenRef.current, stage = stageRef.current;
    if (!root || !host || !stage || !size.width || !size.height) return;
    const pose = device === "phone" ? getPhonePose(value) : getLaptopPose(value);
    camera.zoom = 1;
    camera.clearViewOffset();
    progressRef.current = pose.progress;
    root.rotation.set(...pose.rotation);
    root.position.set(0, pose.positionY, 0);
    prepared.lid?.rotation.set(-pose.lidAngle * Math.PI / 180, 0, 0);
    root.updateMatrixWorld(true);
    const world = prepared.corners.map(point => prepared.screen.localToWorld(point.clone()));
    const center = world.reduce((sum, point) => sum.add(point), new Vector3()).multiplyScalar(0.25);
    const right = world[1].clone().sub(world[0]);
    const up = world[0].clone().sub(world[3]);
    const normal = right.clone().cross(up).normalize();
    const distance = screenFitDistance(right.length(), up.length(), size.width / size.height, camera.fov);
    const displayDistance = distance * (device === "phone" ? 1.65 : 3.1 / LAPTOP_SHOWCASE_ZOOM);
    const targetDistance = displayDistance + (distance - displayDistance) * pose.push;
    const alignedPosition = center.clone().addScaledVector(normal, targetDistance * (1 - pose.handoff * 0.08));
    const entryTarget = new Vector3(0, device === "phone" ? 0 : 0.25, 0);
    if (device === "phone") camera.position.set(2.6, 1.4, 8.2);
    else camera.position.set(4 - pose.opening * 0.5, 3.4 - pose.opening * 0.2, 7.8 - pose.opening * 0.4);
    camera.up.set(0, 1, 0);
    camera.lookAt(entryTarget);
    camera.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(root);
    const modelCorners = [bounds.min.x, bounds.max.x].flatMap(x =>
      [bounds.min.y, bounds.max.y].flatMap(y =>
        [bounds.min.z, bounds.max.z].map(z => new Vector3(x, y, z))));
    const localCorners = modelCorners.map(point => point.clone().applyMatrix4(camera.matrixWorldInverse));
    const clearance = laptopEntryCameraOffset(localCorners, size.width / size.height, camera.fov);
    // Pull back only when a narrow/short viewport would clip the enlarged model.
    // Moving along the same view ray preserves the existing viewing angle.
    camera.position.addScaledVector(camera.position.clone().sub(entryTarget).normalize(), clearance);
    camera.position.lerp(alignedPosition, pose.alignment);
    camera.lookAt(entryTarget);
    const initialQuaternion = camera.quaternion.clone();
    camera.up.copy(up).normalize();
    camera.lookAt(center);
    const alignedQuaternion = camera.quaternion.clone();
    camera.quaternion.copy(initialQuaternion).slerp(alignedQuaternion, pose.alignment);
    camera.updateMatrixWorld(true);
    const introduction = stage.querySelector<HTMLElement>("[data-laptop-introduction]");
    // Keep the full text clearance until the title has faded out, then release
    // it during camera alignment for both the phone and the laptop.
    const reservedSpace = 1 - laptopSegment(pose.progress, 0.35, 0.55);
    if (reservedSpace > 0) {
      const top = introduction ? introduction.offsetTop + introduction.offsetHeight + 24 : 24;
      const bottom = hintRef.current ? hintRef.current.offsetTop - 24 : size.height - 24;
      const availableHeight = Math.max(48, bottom - top);
      const projected = modelCorners.map(point => point.clone().project(camera));
      const modelWidth = (Math.max(...projected.map(point => point.x)) - Math.min(...projected.map(point => point.x))) * size.width / 2;
      const modelHeight = (Math.max(...projected.map(point => point.y)) - Math.min(...projected.map(point => point.y))) * size.height / 2;
      const fit = Math.min(1, (size.width - 48) / modelWidth, availableHeight / modelHeight);
      camera.zoom = 1 + (fit - 1) * reservedSpace;
      camera.updateProjectionMatrix();
      const fitted = modelCorners.map(point => point.clone().project(camera));
      const centerY = (1 - (Math.max(...fitted.map(point => point.y)) + Math.min(...fitted.map(point => point.y))) / 2) * size.height / 2;
      // Offset the shared projection, so the HTML display moves with the model.
      camera.setViewOffset(size.width, size.height, 0, (centerY - (top + availableHeight / 2)) * reservedSpace, size.width, size.height);
    }
    const displayWorld = device === "phone" ? world.map((point, index) =>
      point.clone().addScaledVector(up, index < 2 ? -0.01 : 0.01)) : world;
    const quad = displayWorld.map(point => {
      const projected = point.clone().project(camera);
      return { x: (projected.x + 1) * size.width / 2, y: (1 - projected.y) * size.height / 2 };
    }) as unknown as ScreenQuad;
    const expanded = expandScreenQuad(quad, size.width, size.height, pose.handoff);
    const baseWidth = device === "phone" ? 390 : 1280, baseHeight = baseWidth * up.length() / right.length() * (device === "phone" ? 0.98 : 1);
    const width = baseWidth + (size.width - baseWidth) * pose.handoff;
    const height = baseHeight + (size.height - baseHeight) * pose.handoff;
    const matrix = screenProjectionMatrix(expanded, width, height);
    const front = normal.dot(camera.position.clone().sub(center).normalize()) > 0.06;
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.style.borderRadius = device === "phone" ? `${(1 - pose.handoff) * 14}% / ${(1 - pose.handoff) * 6.5}%` : "0";
    host.style.transform = pose.complete ? "none" : matrix ? `matrix3d(${matrix.join(",")})` : "none";
    const screenVisible = Boolean((matrix && front && pose.lidAngle >= 24) || pose.complete);
    host.style.visibility = screenVisible ? "visible" : "hidden";
    // Player descendants may explicitly set visibility:visible. Opacity on
    // the projected host keeps them from bleeding through a fully closed lid.
    host.style.opacity = screenVisible ? "1" : "0";
    const canvas = stage.querySelector<HTMLElement>("[data-laptop-canvas]");
    if (canvas) canvas.style.opacity = String(pose.sceneOpacity);
    if (hintRef.current) hintRef.current.style.opacity = String(pose.hintOpacity);
    if (introduction) introduction.style.opacity = String(1 - laptopSegment(pose.progress, 0.15, 0.35));
    stage.dataset.laptopProgress = pose.progress.toFixed(6);
    stage.dataset.workspaceDevice = device;
    stage.dataset.laptopLid = pose.lidAngle.toFixed(3);
    stage.dataset.laptopModelScale = String(LAPTOP_MODEL_SCALE);
    const projectedModel = modelCorners.map(point => point.clone().project(camera));
    stage.dataset.laptopModelBounds = JSON.stringify({
      left: (Math.min(...projectedModel.map(point => point.x)) + 1) * size.width / 2,
      right: (Math.max(...projectedModel.map(point => point.x)) + 1) * size.width / 2,
      top: (1 - Math.max(...projectedModel.map(point => point.y))) * size.height / 2,
      bottom: (1 - Math.min(...projectedModel.map(point => point.y))) * size.height / 2,
    });
    stage.dataset.laptopRotationX = pose.rotation[0].toFixed(6);
    stage.dataset.laptopRotationZ = pose.rotation[2].toFixed(6);
    stage.dataset.laptopPhase = pose.complete ? "page" : pose.handoff > 0 ? "handoff" : pose.push > 0 ? "push" : pose.alignment > 0 ? "align" : "opening";
    // Useful geometry diagnostics, also asserted by browser regressions.
    stage.dataset.laptopScreenFacing = String(front);
    invalidate();
  }, [camera, device, hintRef, invalidate, prepared, screenRef, size.height, size.width, stageRef]);

  useLayoutEffect(() => {
    onReady({ render });
    render(progressRef.current);
  }, [onReady, render]);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);

  return <>
    <ambientLight intensity={1.4} />
    <hemisphereLight args={["#ffffff", "#97978d", 2]} />
    <directionalLight position={[2.5, 6, 4]} intensity={4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0002} />
    <directionalLight position={[-4, 2, -2]} intensity={2.5} color="#dfe7ff" />
    <group ref={rootRef} scale={LAPTOP_MODEL_SCALE}><primitive object={model} dispose={null} /></group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, device === "phone" ? -1.65 : -0.7, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={0.14} />
    </mesh>
  </>;
}

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function HomeLaptopScene(props: LaptopSceneProps) {
  return <SceneBoundary onFailure={props.onFailure}>
    <Canvas data-home-laptop-canvas frameloop="demand" shadows dpr={[1, window.innerWidth < 768 ? 1 : 1.5]}
      camera={{ fov: 38, near: 0.01, far: 100, position: [4, 3.4, 7.8] }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.domElement.dataset.homeLaptopCanvas = "true"; }} fallback={null}>
      <LaptopScene {...props} />
    </Canvas>
  </SceneBoundary>;
}
