"use client";

import { useEffect, type RefObject } from "react";

type ContentScrollRevealOptions = {
  enabled: boolean;
  selector?: string;
};

type RevealState = {
  visible: boolean;
  offsetX: number;
  offsetY: number;
  release?: () => void;
};

export const CONTENT_REVEAL_SELECTOR = [
  "[data-animated-content]",
  "[data-scroll-reveal]",
  ".marketing-page [data-qicore-waterfall]",
].join(", ");

const DEDICATED_ANIMATION_SELECTOR = [
  "[data-site-header]",
  "[data-site-footer]",
  "[data-home-carousel]",
  "[data-home-parallax]",
  "[data-about-scene]",
  "[data-review-panel]",
  "[data-logo-loop]",
  "[data-scroll-reveal='off']",
  ".qicore-route-panel.is-outgoing",
  "[data-qicore-film].is-playing",
].join(", ");

function isTransitioning(node: HTMLElement) {
  const documentRoot = document.documentElement;
  const body = document.body;
  const content = node.closest(".qicore-route-content");
  return Boolean(
    documentRoot.dataset.qicoreRouteEntry
    || documentRoot.dataset.productTransitionEntry
    || documentRoot.dataset.oyscatArrival
    || body.matches(".is-product-transitioning, .is-product-transition-arriving, .is-qicore-preparing-home-route")
    || (content && !content.classList.contains("is-idle"))
  );
}

function hasEntranceAnimation(node: HTMLElement) {
  for (let current: HTMLElement | null = node; current; current = current.parentElement) {
    if (current.getAnimations().some(animation => {
      if (animation.playState !== "running" && !animation.pending) return false;
      if (!(animation.effect instanceof KeyframeEffect)) return false;
      return animation.effect.getKeyframes().some(frame =>
        ["transform", "translate", "scale", "opacity", "filter"].some(property => property in frame));
    })) return true;
  }
  return false;
}

export function useContentScrollReveal(
  rootRef: RefObject<HTMLElement | null>,
  { enabled, selector = CONTENT_REVEAL_SELECTOR }: ContentScrollRevealOptions,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let stop: (() => void) | undefined;
    let generation = 0;

    const setup = () => {
      const version = ++generation;
      stop?.();
      stop = undefined;
      if (motion.matches || !("IntersectionObserver" in window)) return;

      void import("gsap").then(({ gsap }) => {
        if (cancelled || version !== generation) return;
        const states = new Map<HTMLElement, RevealState>();
        const handedOff = new WeakSet<HTMLElement>();
        const canReveal = (node: HTMLElement) => {
          if (node.closest(DEDICATED_ANIMATION_SELECTOR)) return false;
          if (isTransitioning(node)) {
            handedOff.add(node);
            return false;
          }
          return !node.parentElement?.closest(selector);
        };

        const release = (state: RevealState) => {
          state.release?.();
          state.release = undefined;
          state.offsetX = 0;
          state.offsetY = 0;
        };
        const reveal = (node: HTMLElement, state: RevealState) => {
          const horizontal = node.dataset.revealDirection === "horizontal";
          const distance = Number(node.dataset.revealDistance ?? 28)
            * (node.dataset.revealReverse === "true" ? -1 : 1);
          const initialOpacity = Number(node.dataset.revealOpacity ?? 0);
          const initialScale = Number(node.dataset.revealScale ?? 1);
          const computed = getComputedStyle(node);
          const opacity = Number(computed.opacity);
          // Individual translate/scale leave CSS and GSAP transform owners alone.
          // If these properties are already owned, use only the fade.
          const move = computed.translate === "none";
          const resize = computed.scale === "none" && initialScale !== 1;
          const animation = node.animate([
            {
              opacity: opacity * initialOpacity,
              ...(move ? { translate: horizontal ? `${distance}px 0px` : `0px ${distance}px` } : {}),
              ...(resize ? { scale: String(initialScale) } : {}),
            },
            {
              opacity,
              ...(move ? { translate: "0px 0px" } : {}),
              ...(resize ? { scale: "1" } : {}),
            },
          ], { duration: 1000, fill: "both" });
          animation.pause();
          animation.currentTime = 0;
          const progress = { value: 0 };
          const paint = () => {
            const position = Math.max(0, Math.min(1, progress.value));
            const remaining = 1 - position;
            state.offsetX = move && horizontal ? distance * remaining : 0;
            state.offsetY = move && !horizontal ? distance * remaining : 0;
            animation.currentTime = position * 1000;
          };
          const tween = gsap.to(progress, {
            value: 1,
            duration: Number(node.dataset.revealDuration ?? 0.8),
            delay: Number(node.dataset.revealDelay ?? 0),
            ease: node.dataset.revealEase ?? "power3.out",
            immediateRender: false,
            onUpdate: paint,
            onComplete: () => {
              release(state);
              if (states.get(node) !== state) return;
              observer.unobserve(node);
              observer.observe(node);
            },
          });
          state.release = () => {
            tween.kill();
            // Cancel only this effect. No inline styles enter route snapshots,
            // and concurrent hover styles/custom properties remain untouched.
            animation.cancel();
          };
          paint();
        };
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const node = entry.target as HTMLElement;
            const state = states.get(node);
            if (!state) return;
            if (!entry.isIntersecting) {
              const rect = node.getBoundingClientRect();
              if (rect.bottom - state.offsetY > 0 && rect.top - state.offsetY < window.innerHeight
                && rect.right - state.offsetX > 0 && rect.left - state.offsetX < window.innerWidth) return;
              state.visible = false;
              handedOff.delete(node);
              release(state);
              return;
            }
            if (state.visible || isTransitioning(node)) return;
            state.visible = true;
            // The route/product entrance already revealed this viewport. Wait
            // for a real exit before replaying, instead of fading it out again.
            if (handedOff.has(node) || hasEntranceAnimation(node) || gsap.isTweening(node)) return;
            reveal(node, state);
          });
        }, {
          threshold: 0,
        });

        const refresh = () => {
          const candidates = root.matches(selector)
            ? [root, ...root.querySelectorAll<HTMLElement>(selector)]
            : [...root.querySelectorAll<HTMLElement>(selector)];
          const targets = new Set(candidates.filter(canReveal));
          states.forEach((state, node) => {
            if (targets.has(node)) return;
            observer.unobserve(node);
            release(state);
            states.delete(node);
          });
          targets.forEach(node => {
            if (states.has(node)) return;
            states.set(node, { visible: false, offsetX: 0, offsetY: 0 });
            observer.observe(node);
          });
        };
        const mutations = new MutationObserver(refresh);
        mutations.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "hidden", "open", "data-scroll-reveal"],
        });
        mutations.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-qicore-route-entry", "data-product-transition-entry", "data-oyscat-arrival"],
        });
        refresh();
        stop = () => {
          mutations.disconnect();
          observer.disconnect();
          states.forEach(release);
          states.clear();
        };
      }).catch(() => {
        // Static markup remains visible if the optional animation chunk fails.
        if (version === generation) stop?.();
      });
    };
    setup();
    motion.addEventListener("change", setup);
    return () => {
      cancelled = true;
      generation++;
      motion.removeEventListener("change", setup);
      stop?.();
    };
  }, [enabled, rootRef, selector]);
}
