"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";

type QiCoreRouteShellProps = {
  canvas: ReactNode;
  children: ReactNode;
};

type RouteFrame = {
  pathname: string;
  content: ReactNode;
  scrollY?: number;
};

type TransitionKind =
  | "idle"
  | "staging-from-home"
  | "staging-between-content"
  | "from-home"
  | "between-content"
  | "to-home";

export function QiCoreRouteShell({ canvas, children }: QiCoreRouteShellProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const [activeFrame, setActiveFrame] = useState<RouteFrame>({ pathname, content: children });
  const [outgoingFrame, setOutgoingFrame] = useState<RouteFrame | null>(null);
  const [transitionKind, setTransitionKind] = useState<TransitionKind>("idle");
  const isContentRoute = pathname !== "/";
  const hasVisibleContent = isContentRoute
    || activeFrame.pathname !== "/"
    || Boolean(outgoingFrame && outgoingFrame.pathname !== "/");

  useLayoutEffect(() => {
    const entryKind = document.documentElement.dataset.qicoreRouteEntry as TransitionKind | undefined;
    if (entryKind !== "from-home" && entryKind !== "between-content" && entryKind !== "to-home") return;

    if (entryKind === "from-home" || entryKind === "between-content") {
      const duration = entryKind === "from-home" ? 1820 : 1320;
      transitionTimerRef.current = window.setTimeout(() => {
        delete document.documentElement.dataset.qicoreRouteEntry;
      }, duration);
      return;
    }

    setTransitionKind("to-home");
    transitionFrameRef.current = window.requestAnimationFrame(() => {
      transitionFrameRef.current = window.requestAnimationFrame(() => {
        delete document.documentElement.dataset.qicoreRouteEntry;
        const duration = 850;
        transitionTimerRef.current = window.setTimeout(() => setTransitionKind("idle"), duration);
      });
    });
  }, []);

  useEffect(() => {
    if (activeFrame.pathname === pathname) return;

    const previousFrame = activeFrame;
    const nextTransition: TransitionKind = previousFrame.pathname === "/"
      ? "from-home"
      : pathname === "/"
        ? "to-home"
        : "between-content";

    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (transitionFrameRef.current) window.cancelAnimationFrame(transitionFrameRef.current);
    setOutgoingFrame(previousFrame.pathname === "/"
      ? null
      : { ...previousFrame, scrollY: window.scrollY });
    setActiveFrame({ pathname, content: children });

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const duration = nextTransition === "from-home" ? 1820 : nextTransition === "between-content" ? 1320 : 850;
    const beginTransition = () => {
      setTransitionKind(nextTransition);
      transitionTimerRef.current = window.setTimeout(() => {
        setOutgoingFrame(null);
        setTransitionKind("idle");
      }, duration);
    };

    if (nextTransition === "from-home" || nextTransition === "between-content") {
      setTransitionKind(nextTransition === "from-home" ? "staging-from-home" : "staging-between-content");
      transitionFrameRef.current = window.requestAnimationFrame(() => {
        transitionFrameRef.current = window.requestAnimationFrame(beginTransition);
      });
    } else {
      beginTransition();
    }
  }, [pathname]);

  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (transitionFrameRef.current) window.cancelAnimationFrame(transitionFrameRef.current);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("is-qicore-content-route", hasVisibleContent);

    return () => {
      document.body.classList.remove("is-qicore-content-route");
    };
  }, [hasVisibleContent]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!hasVisibleContent || !contentRef.current) return;

    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    contentRef.current.style.setProperty("--info-rx", `${y * -0.95}deg`);
    contentRef.current.style.setProperty("--info-ry", `${x * 1.1}deg`);
  }

  function resetPointerTilt() {
    contentRef.current?.style.setProperty("--info-rx", "0deg");
    contentRef.current?.style.setProperty("--info-ry", "0deg");
  }

  return (
    <div className={`qicore-route-shell${hasVisibleContent ? " is-content" : " is-home"}${isContentRoute ? "" : " is-canvas-interactive"}${transitionKind === "to-home" ? " is-returning-home" : ""}`}>
      <div className="qicore-persistent-canvas">{canvas}</div>
      <div
        className={`qicore-route-content is-${transitionKind}`}
        ref={contentRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointerTilt}
      >
        {outgoingFrame && (
          <div
            className="qicore-route-panel is-outgoing"
            key={`outgoing-${outgoingFrame.pathname}`}
            style={{ "--outgoing-scroll-offset": `${-(outgoingFrame.scrollY ?? 0)}px` } as CSSProperties}
          >
            {outgoingFrame.content}
          </div>
        )}
        {activeFrame.pathname !== "/" && (
          <div className="qicore-route-panel is-active" key={`active-${activeFrame.pathname}`}>
            {activeFrame.content}
          </div>
        )}
      </div>
    </div>
  );
}
