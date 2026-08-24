"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type TransitionDirection = "to-oyscat" | "to-qicore";
type TransitionPhase = "idle" | "exiting" | "arriving";

type TransitionState = {
  direction: TransitionDirection;
  phase: TransitionPhase;
};

const PRODUCT_ROUTE = "/oyscat";
const QICORE_ROUTES = new Set(["/", "/about", "/news", "/team"]);
const TRANSITION_KEY = "qicore-product-transition";
const RETURN_KEY = "qicore-product-return";

function getTransitionMarkWidth() {
  return document.documentElement.clientWidth <= 700 ? 130 : 148;
}

function getViewportCenter() {
  return {
    x: document.documentElement.clientWidth / 2,
    y: document.documentElement.clientHeight / 2,
  };
}

function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function readReturnTarget() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(RETURN_KEY) ?? "null") as {
      path?: string;
      scrollY?: number;
    } | null;
    const path = stored?.path && QICORE_ROUTES.has(stored.path) ? stored.path : "/";
    return { path, scrollY: Number.isFinite(stored?.scrollY) ? stored?.scrollY ?? 0 : 0 };
  } catch {
    return { path: "/", scrollY: 0 };
  }
}

function getSymbolOrigin(image: HTMLImageElement) {
  const rect = image.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.5,
    scale: Math.max(0.2, Math.min(3, Math.min(rect.width, rect.height) / getTransitionMarkWidth())),
  };
}

function getWordmarkOrigin(image: HTMLImageElement) {
  const rect = image.getBoundingClientRect();
  const glyphSize = Math.min(rect.height, rect.width * 0.26);
  return {
    x: rect.left + glyphSize * 0.52,
    y: rect.top + rect.height * 0.5,
    scale: Math.max(0.2, Math.min(1, glyphSize / getTransitionMarkWidth())),
  };
}

function getElementOrigin(element: Element, direction: TransitionDirection) {
  const preferredImage = direction === "to-qicore"
    ? document.querySelector<HTMLImageElement>(".oyscat-product-visual img")
    : element.querySelector<HTMLImageElement>(".oyscat-gateway-art")
      ?? (element.matches("img") ? element as HTMLImageElement : null)
      ?? element.querySelector<HTMLImageElement>("img[alt='OysCat']")
      ?? element.querySelector<HTMLImageElement>(".qicore-oyscat-product-wordmark");

  if (preferredImage) {
    const isSymbol = preferredImage.classList.contains("oyscat-gateway-art")
      || Boolean(preferredImage.closest(".oyscat-product-visual"));
    return isSymbol ? getSymbolOrigin(preferredImage) : getWordmarkOrigin(preferredImage);
  }

  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    scale: Math.max(0.2, Math.min(1, Math.min(rect.width, rect.height) / getTransitionMarkWidth())),
  };
}

function getArrivalTarget(direction: TransitionDirection) {
  const target = direction === "to-oyscat"
    ? document.querySelector<HTMLElement>(".oyscat-product-visual img")
    : document.querySelector<HTMLElement>(".oyscat-gateway-art");

  if (!target) return { ...getViewportCenter(), scale: 1 };
  const rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    scale: Math.max(0.2, Math.min(3, Math.min(rect.width, rect.height) / getTransitionMarkWidth())),
  };
}

function setTransitionGeometry(
  layer: HTMLDivElement,
  origin: { x: number; y: number; scale?: number },
  target?: { x: number; y: number; scale: number },
) {
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const center = getViewportCenter();
  const farthestX = Math.max(origin.x, viewportWidth - origin.x);
  const farthestY = Math.max(origin.y, viewportHeight - origin.y);
  const coverScale = Math.hypot(farthestX, farthestY) * 2 / 116 + 1.2;
  layer.style.setProperty("--product-origin-x", `${origin.x}px`);
  layer.style.setProperty("--product-origin-y", `${origin.y}px`);
  const originScale = origin.scale ?? 1;
  layer.style.setProperty("--product-origin-scale", `${originScale}`);
  layer.style.setProperty("--product-pop-scale", `${Math.min(1.18, originScale * 1.08)}`);
  layer.style.setProperty("--product-center-dx", `${center.x - origin.x}px`);
  layer.style.setProperty("--product-center-dy", `${center.y - origin.y}px`);
  layer.style.setProperty("--product-mid-dx", `${(center.x - origin.x) * 0.45}px`);
  layer.style.setProperty("--product-mid-dy", `${(center.y - origin.y) * 0.45}px`);
  layer.style.setProperty("--product-cover-scale", `${coverScale}`);

  if (target) {
    layer.style.setProperty("--product-target-dx", `${target.x - center.x}px`);
    layer.style.setProperty("--product-target-dy", `${target.y - center.y}px`);
    layer.style.setProperty("--product-target-scale", `${target.scale}`);
    layer.style.setProperty(
      "--product-target-surface-scale",
      `${target.scale * (target.scale < 1 ? 1.25 : 1.8)}`,
    );
  }
}

export function ProductTransition() {
  const layerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const [state, setState] = useState<TransitionState>({ direction: "to-oyscat", phase: "idle" });

  const cleanup = useCallback(() => {
    document.body.classList.remove(
      "is-product-transitioning",
      "is-product-transition-arriving",
      "is-product-to-oyscat",
      "is-product-to-qicore",
    );
    delete document.documentElement.dataset.productTransitionEntry;
    busyRef.current = false;
    setState((current) => ({ ...current, phase: "idle" }));
  }, []);

  const startTransition = useCallback((direction: TransitionDirection, source: Element) => {
    if (busyRef.current || !layerRef.current) return;
    busyRef.current = true;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.dataset.motionQuality === "reduced";
    const duration = reducedMotion ? 220 : 560;
    const targetPath = direction === "to-oyscat" ? PRODUCT_ROUTE : readReturnTarget().path;
    const origin = getElementOrigin(source, direction);

    if (direction === "to-oyscat") {
      window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({
        path: QICORE_ROUTES.has(window.location.pathname) ? window.location.pathname : "/",
        scrollY: window.scrollY,
      }));
    }

    layerRef.current.style.setProperty("--product-transition-duration", `${duration}ms`);
    setTransitionGeometry(layerRef.current, origin);
    document.body.classList.add("is-product-transitioning", `is-product-${direction}`);
    setState({ direction, phase: "exiting" });

    timerRef.current = window.setTimeout(() => {
      window.sessionStorage.setItem(TRANSITION_KEY, JSON.stringify({
        direction,
        target: targetPath,
        at: Date.now(),
      }));
      window.location.assign(targetPath);
    }, duration - 24);
  }, []);

  useLayoutEffect(() => {
    const direction = document.documentElement.dataset.productTransitionEntry as TransitionDirection | undefined;
    if ((direction !== "to-oyscat" && direction !== "to-qicore") || !layerRef.current) return;

    busyRef.current = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.dataset.motionQuality === "reduced";
    const duration = reducedMotion ? 220 : 760;
    const target = getArrivalTarget(direction);
    const center = getViewportCenter();
    layerRef.current.style.setProperty("--product-transition-duration", `${duration}ms`);
    setTransitionGeometry(layerRef.current, center, target);

    if (direction === "to-qicore") {
      const { scrollY } = readReturnTarget();
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    }

    document.body.classList.add("is-product-transition-arriving", `is-product-${direction}`);
    frameRef.current = window.requestAnimationFrame(() => {
      setState({ direction, phase: "arriving" });
      timerRef.current = window.setTimeout(cleanup, duration + 40);
    });
  }, [cleanup]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isModifiedClick(event)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const returnTrigger = target.closest<HTMLElement>("[data-qicore-return]");
      if (returnTrigger && window.location.pathname === PRODUCT_ROUTE) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        startTransition("to-qicore", returnTrigger);
        return;
      }

      const productTrigger = target.closest<HTMLElement>("[data-oyscat-entry], a[href='/oyscat']");
      if (!productTrigger || window.location.pathname === PRODUCT_ROUTE) return;
      if (productTrigger instanceof HTMLAnchorElement && (productTrigger.target === "_blank" || productTrigger.hasAttribute("download"))) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      startTransition("to-oyscat", productTrigger);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startTransition]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div
      className={`product-transition-layer is-${state.phase} is-${state.direction}`}
      ref={layerRef}
      aria-hidden="true"
    >
      <div className="product-transition-surface" />
      <div className="product-transition-mark">
        <img className="product-transition-brand" src="/brand/oyscat-symbol.svg" alt="" />
      </div>
    </div>
  );
}
