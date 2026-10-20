"use client";

import { useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Edges, Grid } from "@react-three/drei";
import { PerspectiveCamera, Vector3, type Group } from "three";
import { bearingOf, flightTimes, planeParts, runwayHeading, type PlanePart, type PlanePartKind } from "../lib/home-genpi-plane";

const DROP_HEIGHT = 2.6;
const DROP_SECONDS = 0.45;
const HIGHLIGHT = "#4f632b";
const GROUND_Y = -1.37;

const ACCELERATION = 7;
const CRUISE_SPEED = 14;
const CLIMB_PITCH = 0.2;
// The chase camera sits behind, above and off to one side, in the plane's yaw
// frame. The pilot camera is the pilot's eye inside the cockpit glass, in the
// plane's full frame (pitch and roll included), looking past the propeller.
const CHASE_OFFSET = new Vector3(-11, 3.8, 6.5);
const PILOT_EYE = new Vector3(0.7, 0.95, 0);
const PILOT_GAZE = new Vector3(40, 0.2, 0);
const CHASE_FOV = 32;
const PILOT_FOV = 60;
const WORLD_UP = new Vector3(0, 1, 0);
// Cruise drifts through slow S-turns so the heading (and compass) stay alive.
const WANDER_ANGLE = 0.45;
const WANDER_RATE = 0.1;
const CLOUD_COUNT = 14;
const CLOUD_SPACING = 24;

const colors: Record<PlanePartKind, string> = {
  block: "#e9eae4",
  accent: "#4f632b",
  plank: "#c9b896",
  glass: "#bfe3ee",
  engine: "#6b716b",
  hub: "#4f632b",
  blade: "#2a2f2b",
  fin: "#2a2f2b",
  strut: "#8a8e86",
  wheel: "#151816",
  light: "#ffffff",
  trim: "#7d9a4a",
};

/** Live flight values the modules read every frame (no React state); prop 0 means the propellers are still. */
type FlightLink = { gear: number; prop: number };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

// Overshoots slightly past 1 so each module lands with a small settle.
function easeOutBack(t: number) {
  const c1 = 1.4;
  return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function pitchAt(t: number) {
  const { liftoff, climbDone } = flightTimes;
  if (t < liftoff - 0.3) return 0;
  if (t < climbDone - 1.5) return CLIMB_PITCH * smooth((t - liftoff + 0.3) / 0.9);
  return lerp(CLIMB_PITCH, 0, smooth((t - climbDone + 1.5) / 2.5));
}

function Shape({ part, highlighted }: { part: PlanePart; highlighted: boolean }) {
  const [w, h, d] = part.size;
  const color = part.color ?? colors[part.kind];
  const edge = highlighted ? <Edges color={HIGHLIGHT} /> : <Edges color="#151816" transparent opacity={0.16} />;
  if (part.kind === "wheel") {
    return (
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[w / 2, w / 2, d, 20]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    );
  }
  if (part.kind === "hub" || part.kind === "engine") {
    // Cylinders along the flight axis; the hub tapers into a spinner.
    const front = part.kind === "hub" ? h * 0.28 : h / 2;
    return (
      <mesh rotation-z={-Math.PI / 2}>
        <cylinderGeometry args={[front, h / 2, w, 20]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={part.kind === "engine" ? 0.4 : 0} />
      </mesh>
    );
  }
  if (part.kind === "glass") {
    return (
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial color={color} transparent opacity={0.5} roughness={0.08} metalness={0.1} clearcoat={1} />
        {highlighted ? edge : <Edges color="#5f8fa0" />}
      </mesh>
    );
  }
  if (part.kind === "light") {
    return (
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
    );
  }
  return (
    <mesh>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.65} />
      {edge}
    </mesh>
  );
}

// A module drops into place from above the moment it is placed; after liftoff
// the landing gear folds up into the wings.
function Part({ part, highlighted, instant, flight }: { part: PlanePart; highlighted: boolean; instant: boolean; flight: MutableRefObject<FlightLink> }) {
  const ref = useRef<Group>(null);
  // Own age, not clock.elapsedTime: R3F zeroes the clock whenever the render
  // loop pauses offscreen, which would replay every drop on scroll back.
  const age = useRef(0);
  const isGear = part.kind === "wheel" || part.kind === "strut";
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    age.current += Math.min(delta, 0.05);
    const t = instant ? 1 : Math.min(1, age.current / DROP_SECONDS);
    const k = easeOutBack(t);
    const gear = isGear ? flight.current.gear : 0;
    group.position.set(part.position[0], part.position[1] + (1 - k) * DROP_HEIGHT + gear * 0.6, part.position[2]);
    group.scale.setScalar((0.75 + 0.25 * Math.min(1, t * 1.6)) * (1 - gear));
    group.visible = gear < 0.99;
    if (part.kind === "blade" && t >= 1) group.rotation.x += delta * 14 * flight.current.prop;
  });
  return (
    <group ref={ref} position={[part.position[0], part.position[1] + (instant ? 0 : DROP_HEIGHT), part.position[2]]}>
      <Shape part={part} highlighted={highlighted} />
    </group>
  );
}

// Voxel clouds strung along the flight path; ones left behind hop back ahead.
function Clouds({ rig }: { rig: MutableRefObject<Group | null> }) {
  const refs = useRef<(Group | null)[]>([]);
  const dir = useMemo(() => new Vector3(Math.cos(runwayHeading), 0, -Math.sin(runwayHeading)), []);
  const clouds = useMemo(() => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const side = new Vector3(-dir.z, 0, dir.x);
    return Array.from({ length: CLOUD_COUNT }, (_, index) => {
      const lateral = (random() < 0.5 ? -1 : 1) * (7 + random() * 24);
      const position = dir.clone().multiplyScalar(40 + index * CLOUD_SPACING).addScaledVector(side, lateral);
      position.y = 7 + random() * 16;
      const puffs = Array.from({ length: 3 + Math.floor(random() * 3) }, (_, puff) => ({
        position: [puff * 1.6 - 2 + random(), random() * 0.8, random() * 1.6 - 0.8] as [number, number, number],
        size: 1.4 + random() * 1.6,
      }));
      return { position, puffs };
    });
  }, [dir]);

  useFrame(() => {
    const plane = rig.current;
    if (!plane) return;
    for (const cloud of refs.current) {
      if (!cloud) continue;
      const along = cloud.position.clone().sub(plane.position).dot(dir);
      if (along < -40) cloud.position.addScaledVector(dir, CLOUD_COUNT * CLOUD_SPACING);
    }
  });

  return clouds.map((cloud, index) => (
    <group key={index} ref={node => { refs.current[index] = node; }} position={cloud.position}>
      {cloud.puffs.map((puff, puffIndex) => (
        <mesh key={puffIndex} position={puff.position}>
          <boxGeometry args={[puff.size, puff.size * 0.7, puff.size]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} roughness={1} />
        </mesh>
      ))}
    </group>
  ));
}

function Runway() {
  return (
    <group position={[0, GROUND_Y + 0.01, 0]} rotation-y={runwayHeading}>
      <mesh position={[60, 0, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[136, 5]} />
        <meshStandardMaterial color="#d3d6cd" roughness={1} />
      </mesh>
      {Array.from({ length: 22 }, (_, index) => (
        <mesh key={index} position={[index * 6, 0.01, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.4, 0.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

type FlightState = {
  t: number;
  started: boolean;
  speed: number;
  /** 0 = chase view, 1 = pilot view; eased toward the hover state. */
  view: number;
  cameraFrom: Vector3;
  /** Camera and look-at point relative to the plane, so speed never adds lag. */
  offset: Vector3;
  lookOffset: Vector3;
  bearing: number;
};

export type CompassRefs = {
  /** Rotated so the bearing under the fixed index reads the plane's heading. */
  rose: RefObject<HTMLElement | null>;
  readout: RefObject<HTMLElement | null>;
};

function wanderAt(t: number) {
  const since = t - flightTimes.climbDone;
  if (since <= 0) return { yaw: 0, rate: 0 };
  const ramp = smooth(since / 3);
  return {
    yaw: WANDER_ANGLE * ramp * Math.sin(since * WANDER_RATE),
    rate: WANDER_ANGLE * ramp * WANDER_RATE * Math.cos(since * WANDER_RATE),
  };
}

type AirplaneProps = { placed: number; highlightStep: number; instant: boolean; flying: boolean; pilot: boolean; compass: CompassRefs };

function Airplane({ placed, highlightStep, instant, flying, pilot, compass }: AirplaneProps) {
  const rig = useRef<Group>(null);
  const flight = useRef<FlightLink>({ gear: 0, prop: 0 });
  const state = useRef<FlightState>({ t: 0, started: false, speed: 0, view: 0, cameraFrom: new Vector3(), offset: new Vector3(), lookOffset: new Vector3(), bearing: -1 });
  const scratch = useMemo(() => ({ chase: new Vector3(), pilot: new Vector3(), target: new Vector3(), look: new Vector3(), dir: new Vector3(), up: new Vector3() }), []);

  useFrame(({ camera }, rawDelta) => {
    const plane = rig.current;
    if (!plane) return;
    const s = state.current;
    const yawNow = plane.rotation.y;
    const bearing = bearingOf(yawNow);
    if (bearing !== s.bearing) {
      s.bearing = bearing;
      if (compass.rose.current) compass.rose.current.style.transform = `rotate(${-bearing}deg)`;
      if (compass.readout.current) compass.readout.current.textContent = String(bearing).padStart(3, "0");
    }
    // The plane holds still on the runway while it is built; only takeoff moves it.
    if (!flying || instant) return;
    // Clamp so a paused render loop does not teleport the plane on resume.
    const delta = Math.min(rawDelta, 0.05);
    if (!s.started) {
      s.started = true;
      s.cameraFrom.copy(camera.position).sub(plane.position);
      s.offset.copy(s.cameraFrom);
      s.lookOffset.set(0, 0, 0);
    }
    s.t += delta;
    const { t } = s;
    const wander = wanderAt(t);
    const yaw = runwayHeading + wander.yaw;
    if (t > flightTimes.align) s.speed = Math.min(CRUISE_SPEED, s.speed + ACCELERATION * delta);
    const pitch = pitchAt(t);
    const cruising = t > flightTimes.climbDone;
    // Bank into each turn of the cruise S-curve (left turn, left wing down).
    const roll = cruising ? -wander.rate * 6 + Math.sin(t * 0.6) * 0.03 : 0;

    scratch.dir.set(Math.cos(yaw), 0, -Math.sin(yaw));
    plane.position.addScaledVector(scratch.dir, s.speed * Math.cos(pitch) * delta);
    plane.position.y += s.speed * Math.sin(pitch) * delta + (cruising ? Math.sin(t * 0.9) * 0.004 : 0);
    plane.rotation.set(roll, yaw, pitch, "YZX");

    flight.current.gear = smooth((t - flightTimes.gearUp) / (flightTimes.gearDone - flightTimes.gearUp));
    // Propellers stay still until takeoff, then spin up during engine start.
    flight.current.prop = 3 * smooth(t / flightTimes.align);

    // Ease from the build view into the chase view, and blend into the
    // cockpit while the card is hovered. Everything is relative to the plane.
    s.view = lerp(s.view, pilot ? 1 : 0, 1 - Math.exp(-2.5 * delta));
    plane.updateMatrixWorld();
    scratch.chase.copy(s.cameraFrom).lerp(scratch.target.copy(CHASE_OFFSET).applyAxisAngle(WORLD_UP, yaw), smooth(t / 3));
    scratch.pilot.copy(PILOT_EYE);
    plane.localToWorld(scratch.pilot).sub(plane.position);
    scratch.target.copy(scratch.chase).lerp(scratch.pilot, s.view);
    // Tighter as the view nears the cockpit, so the eye stays inside the glass.
    const follow = 1 - Math.exp(-lerp(3, 24, s.view) * delta);
    s.offset.lerp(scratch.target, follow);
    camera.position.copy(plane.position).add(s.offset);

    scratch.look.copy(scratch.dir).multiplyScalar(3);
    scratch.target.copy(PILOT_GAZE);
    plane.localToWorld(scratch.target).sub(plane.position);
    s.lookOffset.lerp(scratch.look.lerp(scratch.target, s.view), follow);
    // In the cockpit the horizon tilts with the wings.
    scratch.up.set(0, 1, 0).applyQuaternion(plane.quaternion);
    camera.up.copy(WORLD_UP).lerp(scratch.up, s.view).normalize();
    camera.lookAt(scratch.look.copy(plane.position).add(s.lookOffset));
    if (camera instanceof PerspectiveCamera) {
      const fov = lerp(CHASE_FOV, PILOT_FOV, s.view);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      <group ref={rig} rotation-y={runwayHeading}>
        <group position={[-0.4, -1, 0]}>
          {planeParts.slice(0, placed).map((part, index) => (
            <Part key={index} part={part} highlighted={part.stepIndex === highlightStep} instant={instant} flight={flight} />
          ))}
        </group>
      </group>
      {flying && !instant && <Clouds rig={rig} />}
    </>
  );
}

type HomeGenpiBuildSceneProps = {
  /** How many modules (in planeParts order) have been placed so far. */
  placed: number;
  /** The step whose modules are outlined, or -1 for none. */
  highlightStep: number;
  /** Reduced motion: show every placed module in place, no flight. */
  instant: boolean;
  /** Take off along the runway with the camera in pursuit. */
  flying: boolean;
  /** Swap the chase camera for the pilot view (while airborne). */
  pilot: boolean;
  /** DOM nodes of the card's compass dial, written every frame without React. */
  compass: CompassRefs;
  /** Pauses rendering while the screen is scrolled away. */
  active: boolean;
};

export default function HomeGenpiBuildScene({ placed, highlightStep, instant, flying, pilot, compass, active }: HomeGenpiBuildSceneProps) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [12, 8.5, 13], fov: CHASE_FOV, near: 0.05, far: 600 }}
      gl={{ antialias: true, alpha: true }}
      className="size-full!"
    >
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#ffffff", "#d9dcd2", 0.6]} />
      <directionalLight position={[6, 10, 4]} intensity={1.6} />
      <Grid
        position={[0, GROUND_Y, 0]}
        infiniteGrid
        followCamera
        cellSize={1}
        cellThickness={0.6}
        cellColor="#d9dcd2"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#c6cabe"
        fadeDistance={80}
        fadeStrength={1.6}
      />
      <Runway />
      <Airplane placed={placed} highlightStep={highlightStep} instant={instant} flying={flying} pilot={pilot} compass={compass} />
      <ContactShadows position={[0, GROUND_Y + 0.02, 0]} opacity={0.32} scale={18} blur={2.4} far={5} />
    </Canvas>
  );
}
