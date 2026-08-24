"use client";

import { useEffect, useRef } from "react";

const SYMBOL_SRC = "/brand/oyscat-symbol.svg";
const ANIMATION_SRC = "/brand/oyscat-workspace-loading-320-12fps.webp";

export function OysCatHeroAnimation() {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const enteringFromQiCore = document.documentElement.dataset.productTransitionEntry === "to-oyscat";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.dataset.motionQuality === "reduced";
    const delay = enteringFromQiCore ? (reducedMotion ? 240 : 820) : 80;
    const timer = window.setTimeout(() => {
      if (imageRef.current) imageRef.current.src = ANIMATION_SRC;
    }, delay);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <img
      ref={imageRef}
      className="oyscat-hero-animation"
      src={SYMBOL_SRC}
      alt=""
      decoding="async"
    />
  );
}
