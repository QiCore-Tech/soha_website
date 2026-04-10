export const GRID_SIZE = 40;

export const COLOR_OPTIONS = {
  top: { hex: "#C97B72" },
  front: { hex: "#6FA7A1" },
  right: { hex: "#D8C27A" },
  left: { hex: "#9BB8A5" },
  back: { hex: "#9A92B8" },
  bottom: { hex: "#C08EA1" },
  white: { hex: "#F3F1EC" },
  black: { hex: "#3A3D40" }
} as const;

export const FACE_KEYS = ["top", "front", "right", "left", "back", "bottom"] as const;
export const MULTICOLOR_POOL = [...FACE_KEYS, "white", "black"] as const;
export const MULTICOLOR_GRADIENT =
  "conic-gradient(from 180deg, #6FA7A1, #C08EA1, #9A92B8, #C97B72, #D8C27A, #9BB8A5, #F3F1EC, #3A3D40, #6FA7A1)";
export const FOOTER_ALIASES = ["info", "hr"] as const;

export type FaceKey = (typeof FACE_KEYS)[number];
export type PaletteKey = keyof typeof COLOR_OPTIONS;
export type ColorMode = PaletteKey | "multicolor";

export type Voxel = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  colorKey: PaletteKey;
};

export type VoxelDraft = Omit<Voxel, "id">;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function pickRandomColorKey(): PaletteKey {
  return MULTICOLOR_POOL[Math.floor(Math.random() * MULTICOLOR_POOL.length)];
}

export function getMaxZInArea(
  voxels: Voxel[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ignoreId?: number
) {
  let maxZ = 0;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  for (const voxel of voxels) {
    if (ignoreId !== undefined && voxel.id === ignoreId) continue;
    const overlaps =
      minX < voxel.x + voxel.w &&
      maxX >= voxel.x &&
      minY < voxel.y + voxel.h &&
      maxY >= voxel.y;
    if (overlaps) maxZ = Math.max(maxZ, voxel.z + 1);
  }

  return maxZ;
}

export function getTopVoxelAt(voxels: Voxel[], x: number, y: number) {
  let topVoxel: Voxel | null = null;
  for (const voxel of voxels) {
    const inside =
      x >= voxel.x &&
      x < voxel.x + voxel.w &&
      y >= voxel.y &&
      y < voxel.y + voxel.h;
    if (!inside) continue;
    if (!topVoxel || voxel.z >= topVoxel.z) topVoxel = voxel;
  }
  return topVoxel;
}
