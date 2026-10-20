"use client";

import { useEffect, useState, type RefObject } from "react";

// Keep the 2D interactions attached to the active cached route panel.
export function AboutSceneManager({ rootRef, enabled }: { rootRef: RefObject<HTMLDivElement | null>; enabled: boolean }) {
  const [hosts, setHosts] = useState<HTMLElement[]>([]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) { setHosts([]); return; }
    const refresh = () => {
      const next = Array.from(root.querySelectorAll<HTMLElement>(".qicore-route-panel.is-active [data-about-scene]"));
      setHosts(previous => previous.length === next.length && previous.every((host, index) => host === next[index]) ? previous : next);
    };
    const observer = new MutationObserver(refresh);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    refresh();
    return () => observer.disconnect();
  }, [enabled, rootRef]);

  useEffect(() => {
    if (!hosts.length) return;
    const cleanups = hosts.map(host => {
      const button = host.querySelector<HTMLButtonElement>("[data-about-toggle]");
      const toggle = () => {
        const separated = button?.getAttribute("aria-pressed") !== "true";
        button?.setAttribute("aria-pressed", String(separated));
        host.dataset.assemblyState = separated ? "separated" : "assembled";
      };
      button?.addEventListener("click", toggle);
      return () => button?.removeEventListener("click", toggle);
    });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const paint = () => {
      frame = 0;
      hosts.filter(host => host.dataset.aboutScene === "genpi").forEach(host => {
        const section = host.closest<HTMLElement>("[data-about-genpi-section]") ?? host;
        const bounds = section.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (innerHeight * .65 - bounds.top) / Math.max(1, bounds.height)));
        const surface = reduced.matches ? 1 : progress < .3 ? 0 : progress < .7 ? .45 : 1;
        host.style.setProperty("--genpi-surface", String(surface));
      });
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(paint); };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    reduced.addEventListener("change", request);
    paint();
    return () => {
      cleanups.forEach(cleanup => cleanup());
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      reduced.removeEventListener("change", request);
      hosts.forEach(host => host.style.removeProperty("--genpi-surface"));
    };
  }, [hosts]);

  return null;
}
