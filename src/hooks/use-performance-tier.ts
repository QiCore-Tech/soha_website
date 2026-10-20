"use client";

import { useEffect, useState } from "react";

export type PerformanceTier = "high" | "medium" | "low";

export function usePerformanceTier() {
  const [tier, setTier] = useState<PerformanceTier>("medium");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const cores = navigator.hardwareConcurrency ?? 4;
      // navigator.deviceMemory is unavailable in Safari/iPadOS and Firefox, so an
      // unknown value must stay unknown instead of forcing the low-end static
      // homepage on devices that can run the reveal animations.
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const low = media.matches || cores <= 4 || (memory !== undefined && memory <= 4);
      const medium = cores <= 8 || (memory !== undefined && memory <= 8);
      setReducedMotion(media.matches);
      setTier(low ? "low" : medium ? "medium" : "high");
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return {
    tier,
    reducedMotion,
    dpr: tier === "low" ? 1 : tier === "medium" ? 1.25 : 1.5
  };
}
