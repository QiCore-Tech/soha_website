"use client";

import { prepareOyscatArrival } from "@/lib/oyscat-arrival";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  FormEvent as ReactFormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode
} from "react";
import {
  getCachedQiCoreRouteHtml,
  isQiCoreRoute,
  loadQiCoreRouteHtml,
  setCachedQiCoreRouteHtml,
} from "@/lib/qicore-client-navigation";

type QiCoreRouteShellProps = {
  canvas: ReactNode;
  children: ReactNode;
};

type RouteFrame = {
  pathname: string;
  content?: ReactNode;
  html?: string;
};

type RouteSnapshot = {
  pathname: string;
  html: string;
  scrollY: number;
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
  const gatewayArrival = useRef(false);
  const cancelArrival = useRef<(() => void) | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const heroPointerFrameRef = useRef<number | null>(null);
  const activeHeroCardRef = useRef<HTMLElement | null>(null);
  const activeSnapshotRef = useRef<RouteSnapshot | null>(null);
  const [activeFrame, setActiveFrame] = useState<RouteFrame>({ pathname, content: children });
  const [outgoingFrame, setOutgoingFrame] = useState<RouteSnapshot | null>(null);
  const [transitionKind, setTransitionKind] = useState<TransitionKind>("idle");
  const isContentRoute = pathname !== "/";
  const hasVisibleContent = isContentRoute
    || activeFrame.pathname !== "/"
    || Boolean(outgoingFrame && outgoingFrame.pathname !== "/");

  useLayoutEffect(() => {
    const entryKind = document.documentElement.dataset.qicoreRouteEntry as TransitionKind | undefined;
    if (entryKind !== "from-home" && entryKind !== "between-content" && entryKind !== "to-home") return;

    if (entryKind === "from-home" || entryKind === "between-content") {
      const duration = entryKind === "from-home" ? 2050 : 1800;
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

  useLayoutEffect(() => {
    if (pathname === "/" || activeFrame.pathname !== pathname) return;
    const activePanel = contentRef.current?.querySelector<HTMLElement>(".qicore-route-panel.is-active");
    if (!activePanel) return;

    activeSnapshotRef.current = {
      pathname,
      html: activePanel.innerHTML,
      scrollY: window.scrollY,
    };
    setCachedQiCoreRouteHtml(pathname, activePanel.innerHTML);
  }, [activeFrame.pathname, pathname, children]);

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
    const previousSnapshot = activeSnapshotRef.current;
    setOutgoingFrame(
      previousFrame.pathname !== "/" && previousSnapshot?.pathname === previousFrame.pathname
        ? { ...previousSnapshot, scrollY: window.scrollY }
        : null
    );
    const cachedHtml = getCachedQiCoreRouteHtml(pathname);
    setActiveFrame(cachedHtml ? { pathname, html: cachedHtml } : { pathname, content: children });

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (gatewayArrival.current && pathname === "/oyscat") {
      gatewayArrival.current = false;
      setOutgoingFrame(null);
      setTransitionKind("idle");
      return;
    }

    const duration = nextTransition === "from-home" ? 2050 : nextTransition === "between-content" ? 1800 : 850;
    const beginTransition = () => {
      setTransitionKind(nextTransition);
      transitionTimerRef.current = window.setTimeout(() => {
        setOutgoingFrame(null);
        setTransitionKind("idle");
      }, duration);
    };

    if (nextTransition === "from-home" || nextTransition === "between-content") {
      setTransitionKind(nextTransition === "from-home" ? "staging-from-home" : "staging-between-content");
      // A timer keeps the staged frame reliable when Chromium throttles
      // requestAnimationFrame in a background tab. The brief hold is still
      // long enough for the hidden waterfall state to paint first.
      transitionTimerRef.current = window.setTimeout(beginTransition, 40);
    } else {
      beginTransition();
    }
  }, [pathname]);

  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (transitionFrameRef.current) window.cancelAnimationFrame(transitionFrameRef.current);
    if (heroPointerFrameRef.current) window.cancelAnimationFrame(heroPointerFrameRef.current);
    cancelArrival.current?.();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("is-qicore-content-route", hasVisibleContent);

    return () => {
      document.body.classList.remove("is-qicore-content-route");
    };
  }, [hasVisibleContent]);

  useEffect(() => {
    function handleRouteRequest(event: Event) {
      const routeEvent = event as CustomEvent<{ href?: string; gateway?: boolean }>;
      const href = routeEvent.detail?.href;
      if (!href || !isQiCoreRoute(href) || href === window.location.pathname) return;

      event.preventDefault();
      if (routeEvent.detail.gateway) {
        gatewayArrival.current = true;
        cancelArrival.current?.();
        cancelArrival.current = prepareOyscatArrival();
      }
      void (async () => {
        try {
          if (href !== "/") await loadQiCoreRouteHtml(href);
          window.sessionStorage.removeItem("qicore-route-entry");
          window.history.pushState(null, "", href);
        } catch {
          window.location.assign(href);
        }
      })();
    }

    window.addEventListener("qicore:navigate", handleRouteRequest);
    return () => window.removeEventListener("qicore:navigate", handleRouteRequest);
  }, []);

  useEffect(() => {
    const handleFilmEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      contentRef.current
        ?.querySelectorAll<HTMLElement>("[data-qicore-film].is-playing")
        .forEach(closeFilm);
    };

    document.addEventListener("keydown", handleFilmEscape);
    return () => document.removeEventListener("keydown", handleFilmEscape);
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleInvalid = (event: Event) => {
      const input = event.target instanceof HTMLInputElement ? event.target : null;
      if (!input?.matches('[data-oyscat-beta-form] input[name="email"]')) return;

      const isEnglish = document.documentElement.dataset.locale === "en";
      if (input.validity.valueMissing) {
        input.setCustomValidity(isEnglish ? "Enter your email address." : "请输入邮箱地址。");
      } else if (input.validity.typeMismatch) {
        input.setCustomValidity(isEnglish ? "Enter a valid email address." : "请输入有效的邮箱地址。");
      } else {
        input.setCustomValidity("");
      }

      input.addEventListener("input", () => input.setCustomValidity(""), { once: true });
    };

    content.addEventListener("invalid", handleInvalid, true);
    return () => content.removeEventListener("invalid", handleInvalid, true);
  }, []);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!hasVisibleContent || !contentRef.current) return;

    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    contentRef.current.style.setProperty("--info-rx", `${y * -0.95}deg`);
    contentRef.current.style.setProperty("--info-ry", `${x * 1.1}deg`);

    const target = event.target instanceof Element ? event.target : null;
    const art = target?.closest<HTMLElement>(".qicore-route-panel.is-active .themed-hero-art") ?? null;
    const card = art?.querySelector<HTMLElement>(".hero-blueprint-card") ?? null;

    if (activeHeroCardRef.current && activeHeroCardRef.current !== card) {
      resetHeroCard(activeHeroCardRef.current);
    }
    activeHeroCardRef.current = card;

    if (!card || event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = card.getBoundingClientRect();
    const pointerX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const pointerY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));

    if (heroPointerFrameRef.current !== null) window.cancelAnimationFrame(heroPointerFrameRef.current);
    heroPointerFrameRef.current = window.requestAnimationFrame(() => {
      card.dataset.pointerActive = "true";
      card.style.setProperty("--hero-rotate-x", `${(-pointerY * 2.05).toFixed(3)}deg`);
      card.style.setProperty("--hero-rotate-y", `${(pointerX * 2.7).toFixed(3)}deg`);
      card.style.setProperty("--hero-shift-x", `${(pointerX * 5.5).toFixed(2)}px`);
      card.style.setProperty("--hero-shift-y", `${(pointerY * 4.5).toFixed(2)}px`);
      card.style.setProperty("--hero-near-x", `${(pointerX * 13).toFixed(2)}px`);
      card.style.setProperty("--hero-near-y", `${(pointerY * 11).toFixed(2)}px`);
      card.style.setProperty("--hero-far-x", `${(-pointerX * 5.5).toFixed(2)}px`);
      card.style.setProperty("--hero-far-y", `${(-pointerY * 4.5).toFixed(2)}px`);
      card.style.setProperty("--hero-accent-x", `${(pointerX * 8).toFixed(2)}px`);
      card.style.setProperty("--hero-accent-y", `${(pointerY * 7).toFixed(2)}px`);
      card.style.setProperty("--hero-accent-rotate", `${(pointerX * 4).toFixed(2)}deg`);
    });
  }

  function resetPointerTilt() {
    contentRef.current?.style.setProperty("--info-rx", "0deg");
    contentRef.current?.style.setProperty("--info-ry", "0deg");
    resetHeroCard(activeHeroCardRef.current);
    activeHeroCardRef.current = null;
  }

  function resetHeroCard(card: HTMLElement | null) {
    if (!card) return;
    card.dataset.pointerActive = "false";
    card.style.setProperty("--hero-rotate-x", "0deg");
    card.style.setProperty("--hero-rotate-y", "0deg");
    card.style.setProperty("--hero-shift-x", "0px");
    card.style.setProperty("--hero-shift-y", "0px");
    card.style.setProperty("--hero-near-x", "0px");
    card.style.setProperty("--hero-near-y", "0px");
    card.style.setProperty("--hero-far-x", "0px");
    card.style.setProperty("--hero-far-y", "0px");
    card.style.setProperty("--hero-accent-x", "0px");
    card.style.setProperty("--hero-accent-y", "0px");
    card.style.setProperty("--hero-accent-rotate", "0deg");
  }

  function closeFilm(section: HTMLElement) {
    const screen = section.querySelector<HTMLElement>("[data-qicore-film-screen]");
    const poster = section.querySelector<HTMLButtonElement>("[data-qicore-film-play]");
    const closeButton = section.querySelector<HTMLButtonElement>("[data-qicore-film-close]");

    screen?.querySelector("iframe")?.remove();
    screen?.classList.remove("is-playing");
    section.classList.remove("is-playing");
    if (poster) poster.hidden = false;
    if (closeButton) closeButton.hidden = true;
  }

  function handleFilmInteraction(target: EventTarget | null) {
    if (!(target instanceof Element)) return;
    const playButton = target.closest<HTMLElement>("[data-qicore-film-play]");
    const closeButton = target.closest<HTMLElement>("[data-qicore-film-close]");
    const trigger = playButton ?? closeButton;
    const section = trigger?.closest<HTMLElement>("[data-qicore-film]");
    if (!trigger || !section || !section.closest(".qicore-route-panel.is-active")) return;

    if (closeButton) {
      closeFilm(section);
      return;
    }

    const screen = section.querySelector<HTMLElement>("[data-qicore-film-screen]");
    const poster = section.querySelector<HTMLButtonElement>("[data-qicore-film-play]");
    const sectionCloseButton = section.querySelector<HTMLButtonElement>("[data-qicore-film-close]");
    const videoId = screen?.dataset.videoId;
    if (!screen || !poster || !sectionCloseButton || !videoId || screen.querySelector("iframe")) return;

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = "QiCore Technology: MAKE SMART";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    screen.append(iframe);
    screen.classList.add("is-playing");
    section.classList.add("is-playing");
    poster.hidden = true;
    sectionCloseButton.hidden = false;
  }

  function toggleHeroInteraction(target: EventTarget | null) {
    if (!(target instanceof Element)) return;
    const art = target.closest<HTMLElement>(".qicore-route-panel.is-active .themed-hero-art");
    if (!art) return;
    const isActive = art.classList.toggle("is-hero-activated");
    art.setAttribute("aria-pressed", String(isActive));
  }

  function handleNewsEntryInteraction(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target instanceof Element ? event.target : null;
    const toggle = target?.closest<HTMLButtonElement>(".news-entry-toggle");
    const entry = toggle?.closest<HTMLDetailsElement>(".news-entry");
    if (!toggle || !entry || !entry.closest(".qicore-route-panel.is-active")) return;

    event.preventDefault();
    entry.open = !entry.open;
  }

  function handleContentClick(event: ReactMouseEvent<HTMLDivElement>) {
    handleNewsEntryInteraction(event);
    handleFilmInteraction(event.target);
    toggleHeroInteraction(event.target);
  }

  async function handleContentSubmit(event: ReactFormEvent<HTMLDivElement>) {
    const target = event.target instanceof HTMLFormElement ? event.target : null;
    const form = target?.closest<HTMLFormElement>("[data-oyscat-beta-form]");
    if (!form || !form.closest(".qicore-route-panel.is-active")) return;

    event.preventDefault();
    if (form.dataset.submitting === "true") return;
    const input = form.querySelector<HTMLInputElement>('input[name="email"]');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>("[data-beta-status]");
    const email = input?.value.trim() ?? "";
    if (!input || !button || !status || !email || !input.checkValidity()) {
      input?.reportValidity();
      return;
    }

    form.dataset.submitting = "true";
    button.disabled = true;
    status.hidden = true;

    try {
      const response = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale: document.documentElement.dataset.locale ?? "zh", source: input.id === "hero-beta-email" ? "hero" : "footer" }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Beta application failed");

      input.value = "";
      status.dataset.state = "success";
      const zh = status.querySelector<HTMLElement>('[data-lang="zh"]');
      const en = status.querySelector<HTMLElement>('[data-lang="en"]');
      if (zh) zh.textContent = "感谢您的报名，我们将尽快与您联系。";
      if (en) en.textContent = "Thanks for signing up. We'll reach out to you soon.";
    } catch {
      status.dataset.state = "error";
      const zh = status.querySelector<HTMLElement>('[data-lang="zh"]');
      const en = status.querySelector<HTMLElement>('[data-lang="en"]');
      if (zh) zh.textContent = "提交失败，请稍后重试。你的输入已保留。";
      if (en) en.textContent = "Could not submit. Please try again; your input is preserved.";
    } finally {
      status.hidden = false;
      button.disabled = false;
      delete form.dataset.submitting;
    }
  }

  function handleContentKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target?.matches(".themed-hero-art")) return;
    event.preventDefault();
    toggleHeroInteraction(target);
  }

  return (
    <div className={`qicore-route-shell${hasVisibleContent ? " is-content" : " is-home"}${isContentRoute ? "" : " is-canvas-interactive"}${pathname === "/oyscat" ? " is-oyscat-content" : ""}${transitionKind === "to-home" ? " is-returning-home" : ""}`}>
      <div className="qicore-persistent-canvas">{canvas}</div>
      <div
        className={`qicore-route-content is-${transitionKind}`}
        ref={contentRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointerTilt}
        onClick={handleContentClick}
        onSubmit={handleContentSubmit}
        onKeyDown={handleContentKeyDown}
      >
        {outgoingFrame && (
          <div
            className="qicore-route-panel is-outgoing"
            key={`outgoing-${outgoingFrame.pathname}`}
            style={{ "--outgoing-scroll-offset": `${-outgoingFrame.scrollY}px` } as CSSProperties}
            dangerouslySetInnerHTML={{ __html: outgoingFrame.html }}
          />
        )}
        {activeFrame.pathname !== "/" && (activeFrame.html ? (
          <div
            className="qicore-route-panel is-active"
            key={`active-${activeFrame.pathname}`}
            dangerouslySetInnerHTML={{ __html: activeFrame.html }}
          />
        ) : (
          <div className="qicore-route-panel is-active" key={`active-${activeFrame.pathname}`}>
            {activeFrame.content}
          </div>
        ))}
      </div>
    </div>
  );
}
