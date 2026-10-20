"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Locale } from "@/types/locale";
import type { PerformanceTier } from "@/hooks/use-performance-tier";
import { isHomeVideoFullscreen } from "../lib/home-video-fullscreen";
import { getHomeMotionMode, type HomeMotionMode } from "../lib/home-motion-policy";

type Options = { locale: Locale; tier: PerformanceTier; reducedMotion: boolean };

export function useHomeScrollTrigger(rootRef: RefObject<HTMLDivElement | null>, { locale, tier, reducedMotion }: Options) {
  const [mode, setMode] = useState<HomeMotionMode>("static");
  const refreshRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    let frame = 0;
    let context: ReturnType<typeof import("gsap")["gsap"]["context"]> | undefined;
    let media: ReturnType<typeof import("gsap")["gsap"]["matchMedia"]> | undefined;
    let resize: ResizeObserver | undefined;
    let mutation: MutationObserver | undefined;
    const disposers: Array<() => void> = [];
    const restore = () => {
      root.dataset.homeMotion = "static";
      root.style.removeProperty("--home-stage-height");
      root.querySelectorAll("[data-home-stack]").forEach((node) => node.removeAttribute("data-home-stack"));
    };
    restore();
    setMode("static");
    if (reducedMotion) return;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled || !root.isConnected) return;
      gsap.registerPlugin(ScrollTrigger);
      const header = document.querySelector<HTMLElement>("[data-site-header]");
      const offset = () => Math.max(0, header?.getBoundingClientRect().bottom ?? 80) + 16;
      const measure = () => {
        root.style.setProperty("--home-stage-height", `${Math.max(0, window.innerHeight - offset() - 24)}px`);
      };
      const refresh = () => {
        if (cancelled || frame || isHomeVideoFullscreen(root)) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (cancelled || !root.isConnected || isHomeVideoFullscreen(root)) return;
          measure();
          ScrollTrigger.refresh();
        });
      };
      refreshRef.current = refresh;
      context = gsap.context(() => {}, root);
      context.add(() => {
        media = gsap.matchMedia();
        media.add({
          all: "all",
          desktop: "(min-width: 1200px) and (min-height: 760px) and (hover: hover) and (pointer: fine)",
          tablet: "(min-width: 768px)",
          reduce: "(prefers-reduced-motion: reduce)",
        }, (match) => {
          const conditions = match.conditions!;
          if (conditions.reduce) return restore;
          const nextMode = getHomeMotionMode({
            width: window.innerWidth, height: window.innerHeight,
            finePointer: Boolean(conditions.desktop), hover: Boolean(conditions.desktop),
            tier, reducedMotion: Boolean(conditions.reduce),
          });
          root.dataset.homeMotion = nextMode;
          setMode(nextMode);
          // Pinned/parallax work is gated by the motion mode.
          const staticMode = nextMode === "static";
          if (!staticMode) measure();
          let serial = 0;
          // Document order matters: pin spacing must be measured before later chapters.
          root.querySelectorAll<HTMLElement>("[data-home-parallax]").forEach((node) => {
            const id = `home:${++serial}`;
            if (!staticMode && (nextMode === "full" || conditions.tablet)) {
              const amplitude = nextMode === "full" ? Math.min(18, Number(node.dataset.homeParallax || 12)) : 8;
              gsap.fromTo(node, { y: amplitude }, { y: -amplitude, ease: "none", scrollTrigger: {
                id, trigger: node, start: "top bottom", end: "bottom top", scrub: 0.5, invalidateOnRefresh: true,
              } });
            }
          });
          refresh();
          return () => {
            root.style.removeProperty("--home-stage-height");
          };
        }, root);
      });
      root.addEventListener("load", refresh, true);
      root.addEventListener("loadedmetadata", refresh, true);
      window.addEventListener("resize", refresh, { passive: true });
      window.addEventListener("qicore:laptop-refresh", refresh);
      disposers.push(() => {
        root.removeEventListener("load", refresh, true);
        root.removeEventListener("loadedmetadata", refresh, true);
        window.removeEventListener("resize", refresh);
        window.removeEventListener("qicore:laptop-refresh", refresh);
      });
      const sizes = new WeakMap<Element, string>();
      resize = new ResizeObserver((entries) => {
        let changed = false;
        for (const entry of entries) {
          const size = `${entry.contentRect.width}:${entry.contentRect.height}`;
          if (sizes.get(entry.target) !== size) { sizes.set(entry.target, size); changed = true; }
        }
        if (changed) refresh();
      });
      root.querySelectorAll("[data-home-measure]").forEach((node) => resize!.observe(node));
      if (header) resize.observe(header);
      const shell = root.closest(".qicore-route-shell");
      mutation = new MutationObserver(() => {
        if (!shell?.classList.contains("is-returning-home") && !document.documentElement.dataset.qicoreRouteEntry) refresh();
      });
      if (shell) mutation.observe(shell, { attributes: true, attributeFilter: ["class"] });
      mutation.observe(document.documentElement, { attributes: true, attributeFilter: ["data-qicore-route-entry"] });
      void document.fonts.ready.then(refresh);
      refresh();
    }).catch(() => {
      cancelAnimationFrame(frame);
      refreshRef.current = null;
      resize?.disconnect();
      mutation?.disconnect();
      disposers.forEach((dispose) => dispose());
      media?.revert();
      context?.revert();
      restore();
      if (!cancelled) setMode("static");
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      refreshRef.current = null;
      resize?.disconnect();
      mutation?.disconnect();
      disposers.forEach((dispose) => dispose());
      media?.revert();
      context?.revert();
      restore();
    };
  }, [rootRef, tier, reducedMotion]);

  useEffect(() => { refreshRef.current?.(); }, [locale]);
  return mode;
}
