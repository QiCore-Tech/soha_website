"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { isHomeVideoFullscreen } from "../lib/home-video-fullscreen";
import { LAPTOP_COVER_UNITS, canEnhanceLaptop, getWorkspaceDevice, laptopCoverDistance, laptopPinDistance, laptopScrollUnits } from "../lib/home-laptop-motion";
import type { LaptopController, WorkspaceDevice } from "../lib/home-laptop-types";

type SceneModule = typeof import("../components/home-laptop-scene");
type LoadedScene = { Component: SceneModule["HomeLaptopScene"]; model: Awaited<ReturnType<SceneModule["loadLaptopModel"]>>; device: WorkspaceDevice };
type Connection = { saveData?: boolean; addEventListener?: (name: string, listener: () => void) => void; removeEventListener?: (name: string, listener: () => void) => void };

export function useHomeLaptopScroll(stageRef: RefObject<HTMLDivElement | null>, screenRef: RefObject<HTMLDivElement | null>) {
  const [eligible, setEligible] = useState(false);
  const [scene, setScene] = useState<LoadedScene | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [complete, setComplete] = useState(false);
  const [autoplayAllowed, setAutoplayAllowed] = useState(false);
  const [device, setDevice] = useState<WorkspaceDevice | null>(null);
  const deviceRef = useRef<WorkspaceDevice | null>(null);
  const activatedRef = useRef(false);
  const controllerRef = useRef<LaptopController | null>(null);

  useEffect(() => {
    const sync = () => {
      if (stageRef.current && isHomeVideoFullscreen(stageRef.current)) return;
      const next = getWorkspaceDevice(window.innerWidth, window.innerHeight);
      if (next === deviceRef.current) return;
      deviceRef.current = next;
      setDevice(next);
      setFailed(false);
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    window.addEventListener("qicore:laptop-refresh", sync);
    return () => {
      window.removeEventListener("resize", sync);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("qicore:laptop-refresh", sync);
    };
  }, [stageRef]);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: Connection; deviceMemory?: number }).connection;
    const sync = () => {
      const allowed = canEnhanceLaptop({ reducedMotion: media.matches, saveData: Boolean(connection?.saveData), cores: navigator.hardwareConcurrency, memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory });
      setEligible(allowed);
      setAutoplayAllowed(allowed);
    };
    sync();
    media.addEventListener("change", sync);
    connection?.addEventListener?.("change", sync);
    return () => { media.removeEventListener("change", sync); connection?.removeEventListener?.("change", sync); };
  }, []);

  const onReady = useCallback((controller: LaptopController) => {
    controllerRef.current = controller;
    setReady(true);
  }, []);
  const onFailure = useCallback(() => { setFailed(true); setComplete(false); }, []);

  useEffect(() => {
    setScene(null);
    setReady(false);
    if (!eligible || failed || !device || !stageRef.current) return;
    let cancelled = false, started = false;
    let resource: LoadedScene["model"] | undefined;
    let dispose: SceneModule["disposeLaptopModel"] | undefined;
    const load = () => {
      if (started) return;
      started = true;
      activatedRef.current = true;
      observer.disconnect();
      void import("../components/home-laptop-scene").then(async module => {
        if (cancelled) return;
        dispose = module.disposeLaptopModel;
        // A context probe keeps WebGL failures out of React/console and the page readable.
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2") || probe.getContext("webgl");
        if (!gl) throw new Error("WebGL unavailable");
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        const model = await module.loadLaptopModel(device);
        if (cancelled) { module.disposeLaptopModel(model); return; }
        resource = model;
        setScene({ Component: module.HomeLaptopScene, model, device });
      }).catch(() => { if (!cancelled) onFailure(); });
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) load();
    }, { rootMargin: "600px 0px" });
    if (activatedRef.current) load();
    else observer.observe(stageRef.current);
    return () => {
      cancelled = true;
      observer.disconnect();
      controllerRef.current = null;
      if (resource) dispose?.(resource);
    };
  }, [device, eligible, failed, onFailure, stageRef]);

  useEffect(() => {
    const stage = stageRef.current, screen = screenRef.current;
    if (!eligible || failed || !ready || !scene || !stage || !screen) { setAnimated(false); setComplete(false); return; }
    let cancelled = false, frame = 0;
    let context: ReturnType<typeof import("gsap")["gsap"]["context"]> | undefined;
    let trigger: import("gsap/ScrollTrigger").ScrollTrigger | undefined;
    let resize: ResizeObserver | undefined;
    const progress = { value: 0 };
    let stableHeight = window.innerHeight, stableWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    // The hero and its darkening veil are driven here so the cover stays gated by
    // the same eligibility as the laptop scene and reverts with it.
    const hero = document.querySelector<HTMLElement>("[data-home-carousel]");
    const veil = hero?.querySelector<HTMLElement>("[data-home-carousel-veil]") ?? null;
    // ScrollTrigger pins the wrapper while the cover tween moves the stage inside it;
    // animating the pinned element itself would have both writers fight over transform.
    const pin = stage.closest<HTMLElement>("[data-home-laptop-pin]") ?? stage;
    const cover = () => laptopCoverDistance(window.innerHeight);
    const reset = () => {
      stage.dataset.laptopMode = "static";
      delete stage.dataset.laptopProgress;
      delete stage.dataset.laptopPhase;
      delete stage.dataset.laptopStart;
      delete stage.dataset.laptopEnd;
      delete stage.dataset.laptopCover;
      screen.style.removeProperty("width");
      screen.style.removeProperty("height");
      screen.style.removeProperty("transform");
      screen.style.removeProperty("visibility");
      screen.style.removeProperty("opacity");
      screen.style.removeProperty("border-radius");
      screen.inert = false;
      screen.removeAttribute("aria-hidden");
      hero?.style.removeProperty("transform");
      veil?.style.removeProperty("opacity");
    };
    const sync = () => {
      if (cancelled) return;
      if (isHomeVideoFullscreen(stage)) {
        controllerRef.current?.render(1);
        screen.inert = false;
        screen.removeAttribute("aria-hidden");
        setComplete(true);
        return;
      }
      controllerRef.current?.render(progress.value);
      const done = progress.value >= 0.999999 && trigger?.progress === 1;
      screen.inert = !done;
      if (done) screen.removeAttribute("aria-hidden");
      else screen.setAttribute("aria-hidden", "true");
      setComplete(Boolean(done));
    };
    let refresh = () => {};
    // GSAP resolves a tween's duration once, so the pose tween is re-timed before
    // every refresh: its length must keep matching laptopScrollDistance(stableWidth).
    let setPoseDuration: (value: number) => void = () => {};
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      stage.dataset.laptopMode = "animated";
      setAnimated(true);
      screen.inert = true;
      context = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
          // Pin from the bottom edge so the workspace can rise over the frozen hero.
          id: "home:laptop", trigger: pin, pin: pin, start: "top bottom",
          end: () => `+=${laptopPinDistance(stableWidth, stableHeight)}`,
          scrub: 0.35, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 3,
          onUpdate: self => {
            // Pause immediately on reverse, not after the scrub catches up.
            if (!isHomeVideoFullscreen(stage) && self.progress < 1) { setComplete(false); screen.inert = true; }
          },
          onRefresh: self => {
            // laptopStart marks where the pose timeline begins, after the cover rise.
            stage.dataset.laptopStart = String(self.start + cover());
            stage.dataset.laptopEnd = String(self.end);
            stage.dataset.laptopCover = String(cover());
            requestAnimationFrame(sync);
          },
        } });
        // A short foreground rise swaps screens: the hero holds while the workspace slides over it.
        timeline.fromTo(stage, { y: 0 }, { y: () => -window.innerHeight, duration: LAPTOP_COVER_UNITS }, 0);
        if (hero) timeline.fromTo(hero, { y: 0 }, { y: cover, duration: LAPTOP_COVER_UNITS }, 0);
        if (veil) timeline.fromTo(veil, { opacity: 0 }, { opacity: 0.4, duration: LAPTOP_COVER_UNITS }, 0);
        // The pose tween owns everything after the cover, so pose progress stays a
        // linear function of scroll between laptopStart and laptopEnd. Built with
        // gsap.fromTo because timeline.to() returns the timeline, not the tween, and
        // the tween itself is what gets retimed when the viewport changes.
        const pose = gsap.fromTo(progress, { value: 0 }, { value: 1, duration: laptopScrollUnits(stableWidth), ease: "none", onUpdate: sync });
        timeline.add(pose, LAPTOP_COVER_UNITS);
        setPoseDuration = duration => pose.duration(duration);
        trigger = timeline.scrollTrigger;
      }, stage);
      refresh = () => {
        if (cancelled || frame || isHomeVideoFullscreen(stage)) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (cancelled || isHomeVideoFullscreen(stage)) return;
          const width = window.innerWidth, height = window.innerHeight;
          // Address-bar-only changes resize the projection without changing scroll distance.
          if (Math.abs(width - stableWidth) > 1 || (width >= 768 && Math.abs(height - lastHeight) > 2) || Math.abs(height - stableHeight) > stableHeight * 0.35) {
            stableWidth = width; stableHeight = height;
          }
          lastHeight = height;
          setPoseDuration(laptopScrollUnits(stableWidth));
          ScrollTrigger.refresh();
          sync();
        });
      };
      resize = new ResizeObserver(refresh);
      resize.observe(stage);
      window.addEventListener("resize", refresh, { passive: true });
      window.addEventListener("qicore:laptop-refresh", refresh);
      void document.fonts.ready.then(refresh);
      refresh();
      sync();
    }).catch(() => { if (!cancelled) onFailure(); });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("qicore:laptop-refresh", refresh);
      context?.revert();
      reset();
    };
  }, [eligible, failed, ready, scene, screenRef, stageRef, onFailure]);

  return { scene: failed ? null : scene, animated: animated && !failed && eligible, complete, playbackEnabled: !eligible || failed || complete, autoplayAllowed: autoplayAllowed && !failed, onReady, onFailure };
}
