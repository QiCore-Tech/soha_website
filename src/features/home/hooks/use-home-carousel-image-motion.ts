"use client";

import { useEffect, useRef, type RefObject } from "react";
import { CAROUSEL_IMAGE_MOTION_DURATION, getCarouselImageMotion } from "../lib/home-carousel-motion";

export function useHomeCarouselImageMotion(rootRef: RefObject<HTMLElement | null>, activeIndex: number, reducedMotion: boolean, ready: boolean) {
  const recentDirections = useRef<Array<"in" | "out">>([]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !ready) return;
    if (reducedMotion) {
      recentDirections.current = [];
      root.querySelectorAll<HTMLImageElement>(".home-carousel-image").forEach(image => {
        image.style.removeProperty("transform");
        delete image.dataset.carouselZoom;
      });
      return;
    }
    let image: HTMLImageElement | null = null;
    let animation: Animation | undefined;
    // Swiper owns slide classes and transforms; wait for its class update and
    // animate only the image, never its slide or wrapper.
    const frame = requestAnimationFrame(() => {
      image = root.querySelector<HTMLImageElement>(".swiper-slide-active .home-carousel-image");
      if (!image || typeof image.animate !== "function") return;
      const motion = getCarouselImageMotion(Math.random(), recentDirections.current);
      // Keep the random variation visible instead of allowing a long run of
      // only zoom-ins or only zoom-outs.
      recentDirections.current = [...recentDirections.current.slice(-1), motion.direction];
      image.style.removeProperty("transform");
      image.dataset.carouselZoom = motion.direction;
      try {
        animation = image.animate([
          { transform: `scale(${motion.from})` },
          { transform: `scale(${motion.to})` },
        ], { duration: CAROUSEL_IMAGE_MOTION_DURATION, easing: "ease-in-out", fill: "forwards" });
      } catch {
        // Optional motion must not affect the static banner or navigation.
        delete image.dataset.carouselZoom;
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      // Freeze the outgoing image so a mid-animation slide change doesn't
      // snap its scale during Swiper's own transition.
      if (image?.isConnected && animation) image.style.transform = getComputedStyle(image).transform;
      animation?.cancel();
    };
  }, [rootRef, activeIndex, reducedMotion, ready]);
}
