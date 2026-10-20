import type { PerformanceTier } from "@/hooks/use-performance-tier";

export type HomeMotionMode = "full" | "light" | "static";

export function getHomeMotionMode({ width, height, finePointer, hover, tier, reducedMotion }: {
  width: number;
  height: number;
  finePointer: boolean;
  hover: boolean;
  tier: PerformanceTier;
  reducedMotion: boolean;
}): HomeMotionMode {
  if (reducedMotion || tier === "low") return "static";
  return width >= 1200 && height >= 760 && finePointer && hover ? "full" : "light";
}

export function canAutoplayHomeVideo({ tier, reducedMotion, saveData, motionAvailable }: {
  tier: PerformanceTier;
  reducedMotion: boolean;
  saveData: boolean;
  motionAvailable: boolean;
}) {
  return motionAvailable && tier !== "low" && !reducedMotion && !saveData;
}
