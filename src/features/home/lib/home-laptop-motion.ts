import type { WorkspaceDevice } from "./home-laptop-types";

export const LAPTOP_SHOWCASE_ZOOM = 1.3;
export const LAPTOP_MODEL_SCALE = 10 * LAPTOP_SHOWCASE_ZOOM;

export type ScreenPoint = { x: number; y: number };
export type ScreenQuad = readonly [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint];

const limit = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
export const laptopSegment = (progress: number, start: number, end: number) => limit((progress - start) / (end - start));

export function getWorkspaceDevice(width: number, height: number): WorkspaceDevice {
  return width < 768 || (width < 1024 && height <= 500) ? "phone" : "laptop";
}

export function getPhonePose(value: number) {
  const pose = getLaptopPose(value);
  const turn = laptopSegment(pose.progress, 0.1, 0.55);
  return {
    ...pose,
    lidAngle: 105,
    rotation: [mix(0.12, 0, turn), mix(-0.55, 0, turn), mix(-0.08, 0, turn)] as const,
    positionY: 0,
  };
}

/** Every pose is a pure function of scroll, including reverse playback. */
export function getLaptopPose(value: number) {
  const progress = limit(value);
  const opening = laptopSegment(progress, 0.1, 0.35);
  const alignment = laptopSegment(progress, 0.35, 0.55);
  const push = laptopSegment(progress, 0.55, 0.85);
  const handoff = laptopSegment(progress, 0.85, 1);
  return {
    progress, opening, alignment, push, handoff,
    lidAngle: mix(0, 105, opening),
    rotation: [mix(opening * 0.06, Math.PI / 12, alignment), mix(-0.32 + opening * 0.06, 0, alignment), 0] as const,
    positionY: mix(-0.65 + opening * 0.08, -0.45, alignment),
    sceneOpacity: 1 - laptopSegment(progress, 0.92, 1),
    hintOpacity: 1 - laptopSegment(progress, 0.1, 0.25),
    complete: progress >= 1,
  };
}

export function canEnhanceLaptop({ reducedMotion, saveData, cores, memory }: {
  reducedMotion: boolean; saveData: boolean; cores?: number; memory?: number;
}) {
  return !reducedMotion && !saveData && !(cores !== undefined && cores <= 2) && !(memory !== undefined && memory <= 2);
}

/** Viewport heights the laptop pose timeline stays pinned for. */
export function laptopScrollUnits(width: number) {
  return width >= 1200 ? 4 : width >= 768 ? 3.5 : 3;
}

export function laptopScrollDistance(width: number, stableHeight: number) {
  return Math.round(stableHeight * laptopScrollUnits(width));
}

/** Fraction of the viewport the workspace needs to rise over the frozen hero.
 *  Kept short so a slight downward scroll completes the first-to-second screen swap. */
export const LAPTOP_COVER_UNITS = 0.4;

export function laptopCoverDistance(height: number) {
  return Math.round(height * LAPTOP_COVER_UNITS);
}

/** Cover rise plus the pose timeline the laptop chapter stays pinned for. */
export function laptopPinDistance(width: number, height: number) {
  return laptopCoverDistance(height) + laptopScrollDistance(width, height);
}

/** Additional distance needed to keep the enlarged closed/open laptop in frame.
 * Points are camera-local; negative z is in front of the lens. */
export function laptopEntryCameraOffset(points: readonly { x: number; y: number; z: number }[], aspect: number, fov: number) {
  const tangent = Math.tan(fov * Math.PI / 360);
  return points.reduce((offset, point) => Math.max(offset,
    Math.abs(point.x) / (tangent * aspect * 0.82) + point.z,
    Math.abs(point.y) / (tangent * 0.86) + point.z,
  ), 0);
}

export function screenFitDistance(width: number, height: number, aspect: number, fov: number, coverage = 0.95) {
  if ([width, height, aspect, fov, coverage].some(value => !Number.isFinite(value) || value <= 0) || fov >= 180) {
    throw new RangeError("Invalid screen/camera dimensions");
  }
  const tangent = Math.tan(fov * Math.PI / 360);
  return Math.max(height / (2 * tangent), width / (2 * aspect * tangent)) / coverage;
}

export function expandScreenQuad(quad: ScreenQuad, width: number, height: number, progress: number): ScreenQuad {
  const target: ScreenQuad = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
  const p = limit(progress);
  return quad.map((point, index) => ({ x: mix(point.x, target[index].x, p), y: mix(point.y, target[index].y, p) })) as unknown as ScreenQuad;
}

/** Project a DOM rectangle into a camera-projected quad, without rasterizing HTML. */
export function screenProjectionMatrix(quad: ScreenQuad, width: number, height: number): number[] | null {
  if (width <= 0 || height <= 0 || quad.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return null;
  const [p0, p1, p2, p3] = quad;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y;
  const dx3 = p0.x - p1.x + p2.x - p3.x, dy3 = p0.y - p1.y + p2.y - p3.y;
  let g = 0, h = 0;
  if (Math.abs(dx3) + Math.abs(dy3) > 1e-8) {
    const determinant = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(determinant) < 1e-8) return null;
    g = (dx3 * dy2 - dx2 * dy3) / determinant;
    h = (dx1 * dy3 - dx3 * dy1) / determinant;
  }
  const result = [
    (p1.x - p0.x + g * p1.x) / width, (p1.y - p0.y + g * p1.y) / width, 0, g / width,
    (p3.x - p0.x + h * p3.x) / height, (p3.y - p0.y + h * p3.y) / height, 0, h / height,
    0, 0, 1, 0, p0.x, p0.y, 0, 1,
  ];
  return result.every(Number.isFinite) ? result : null;
}
