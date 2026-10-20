import { messages } from "@/i18n/messages";

import type { LocalizedText } from "@/types/locale";

// The airplane the GenPI demo assembles, one module at a time. Units are module
// cells: x runs nose (+) to tail (-), y is up, z is the wing span.

export type PlanePartKind =
  | "block" | "accent" | "plank" | "glass" | "engine" | "hub" | "blade" | "fin" | "strut" | "wheel" | "light" | "trim";

export type PlaneModule = "block" | "plank" | "glass" | "engine" | "rotor" | "fin" | "strut" | "wheel" | "light" | "trim";

export type PlanePart = {
  kind: PlanePartKind;
  position: [number, number, number];
  size: [number, number, number];
  /** Overrides the kind's default colour (navigation lights). */
  color?: string;
};

export type PlaneStep = {
  label: LocalizedText;
  parts: PlanePart[];
};

/** What the left-hand console calls each module, and the swatch it shows. */
export const planeModules: Record<PlaneModule, { label: LocalizedText; swatch: string }> = {
  block: { label: messages.homeScreens.genpiModuleBlock, swatch: "#e9eae4" },
  plank: { label: messages.homeScreens.genpiModulePlank, swatch: "#c9b896" },
  glass: { label: messages.homeScreens.genpiModuleGlass, swatch: "#bfe3ee" },
  engine: { label: messages.homeScreens.genpiModuleEngine, swatch: "#6b716b" },
  rotor: { label: messages.homeScreens.genpiModuleRotor, swatch: "#4f632b" },
  fin: { label: messages.homeScreens.genpiModuleFin, swatch: "#2a2f2b" },
  strut: { label: messages.homeScreens.genpiModuleStrut, swatch: "#8a8e86" },
  wheel: { label: messages.homeScreens.genpiModuleWheel, swatch: "#151816" },
  light: { label: messages.homeScreens.genpiModuleLight, swatch: "#e2574c" },
  trim: { label: messages.homeScreens.genpiModuleTrim, swatch: "#7d9a4a" },
};

const moduleByKind: Record<PlanePartKind, PlaneModule> = {
  block: "block",
  accent: "block",
  plank: "plank",
  glass: "glass",
  engine: "engine",
  hub: "rotor",
  blade: "rotor",
  fin: "fin",
  strut: "strut",
  wheel: "wheel",
  light: "light",
  trim: "trim",
};

export function moduleOf(part: PlanePart): PlaneModule {
  return moduleByKind[part.kind];
}

const block = 0.96;
const mirrored = (z: number) => [-z, z];

const fuselage: PlanePart[] = [
  // Lower keel, tail to nose, then the raised cabin row behind the cockpit.
  ...Array.from({ length: 9 }, (_, index): PlanePart => ({ kind: "block", position: [index - 4, 1, 0], size: [block, block, block] })),
  ...Array.from({ length: 4 }, (_, index): PlanePart => ({ kind: "block", position: [index - 3, 2, 0], size: [block, block, block] })),
  { kind: "accent", position: [5, 1, 0], size: [0.6, 0.7, 0.7] },
];

const wings: PlanePart[] = [
  ...[1.3, 2.9, 4.5].flatMap(z => mirrored(z).map((side): PlanePart => ({ kind: "plank", position: [0.5, 1, side], size: [1.8, 0.18, 1.56] }))),
  ...mirrored(5.5).map((side): PlanePart => ({ kind: "accent", position: [0.5, 1, side], size: [1.2, 0.3, 0.4] })),
];

const cockpit: PlanePart[] = [
  { kind: "glass", position: [1.3, 1.85, 0], size: [1.6, 0.75, 0.9] },
  ...[-3, -2, -1, 0].flatMap(x => mirrored(0.5).map((side): PlanePart => ({ kind: "glass", position: [x, 2, side], size: [0.5, 0.35, 0.04] }))),
];

const engines: PlanePart[] = [
  ...mirrored(2.9).map((side): PlanePart => ({ kind: "engine", position: [0.9, 0.6, side], size: [1.6, 0.6, 0.6] })),
  ...mirrored(2.9).map((side): PlanePart => ({ kind: "blade", position: [1.75, 0.6, side], size: [0.05, 0.5, 0.12] })),
];

const tail: PlanePart[] = [
  { kind: "fin", position: [-4, 2, 0], size: [1.2, 1, 0.16] },
  { kind: "fin", position: [-4.2, 2.85, 0], size: [0.8, 0.7, 0.16] },
  ...mirrored(1.2).map((side): PlanePart => ({ kind: "plank", position: [-4, 1.2, side], size: [1, 0.14, 1.4] })),
];

const propeller: PlanePart[] = [
  { kind: "hub", position: [5.45, 1, 0], size: [0.3, 0.36, 0.36] },
  { kind: "blade", position: [5.62, 1, 0], size: [0.07, 2.8, 0.26] },
  { kind: "blade", position: [5.62, 1, 0], size: [0.07, 0.26, 2.8] },
];

const landingGear: PlanePart[] = [
  ...mirrored(1.3).map((side): PlanePart => ({ kind: "strut", position: [0.6, 0.45, side], size: [0.14, 0.9, 0.14] })),
  { kind: "strut", position: [4, 0.26, 0], size: [0.12, 0.52, 0.12] },
  ...mirrored(1.3).map((side): PlanePart => ({ kind: "wheel", position: [0.6, -0.05, side], size: [0.6, 0.6, 0.22] })),
  { kind: "wheel", position: [4, -0.15, 0], size: [0.4, 0.4, 0.16] },
];

const details: PlanePart[] = [
  { kind: "light", position: [0.5, 1, -5.8], size: [0.2, 0.2, 0.2], color: "#e2574c" },
  { kind: "light", position: [0.5, 1, 5.8], size: [0.2, 0.2, 0.2], color: "#5fb82a" },
  { kind: "light", position: [-4.2, 3.3, 0], size: [0.18, 0.18, 0.18], color: "#ffffff" },
  ...mirrored(0.5).map((side): PlanePart => ({ kind: "trim", position: [1.5, 0.75, side], size: [3, 0.16, 0.03] })),
];

export const planeSteps: PlaneStep[] = [
  { label: messages.homeScreens.genpiBuildStepFuselage, parts: fuselage },
  { label: messages.homeScreens.genpiBuildStepWings, parts: wings },
  { label: messages.homeScreens.genpiBuildStepCockpit, parts: cockpit },
  { label: messages.homeScreens.genpiBuildStepEngines, parts: engines },
  { label: messages.homeScreens.genpiBuildStepTail, parts: tail },
  { label: messages.homeScreens.genpiBuildStepRotor, parts: propeller },
  { label: messages.homeScreens.genpiBuildStepGear, parts: landingGear },
  { label: messages.homeScreens.genpiBuildStepDetails, parts: details },
];

/** Every module in placement order, tagged with the step it belongs to. */
export const planeParts = planeSteps.flatMap((step, stepIndex) => step.parts.map(part => ({ ...part, stepIndex })));

/** Index into planeParts where each step begins; the last entry is the total. */
export const planeStepStarts = planeSteps.reduce<number[]>((starts, step) => [...starts, starts[starts.length - 1] + step.parts.length], [0]);

/** Takeoff timeline in seconds after the last module lands; the scene and the console share it. */
export const flightTimes = { align: 1.4, liftoff: 3, gearUp: 3.6, gearDone: 4.4, climbDone: 7 };

export const flightStages: { label: LocalizedText; until: number }[] = [
  { label: messages.homeScreens.genpiFlightAlign, until: flightTimes.align },
  { label: messages.homeScreens.genpiFlightRoll, until: flightTimes.liftoff },
  { label: messages.homeScreens.genpiFlightLiftoff, until: flightTimes.gearUp },
  { label: messages.homeScreens.genpiFlightGear, until: flightTimes.gearDone },
  { label: messages.homeScreens.genpiFlightClimb, until: flightTimes.climbDone },
];

/** The plane is built already facing down the runway, at this yaw (radians about +y). */
export const runwayHeading = 1;

/** Compass bearing in whole degrees (north = -z, east = +x) for a yaw about +y. */
export function bearingOf(yaw: number) {
  const degrees = (Math.atan2(Math.cos(yaw), Math.sin(yaw)) * 180) / Math.PI;
  return Math.round((degrees + 360) % 360);
}
