"use client";

import { useEffect, type RefObject } from "react";

type DisclosureAnimation = {
  expanded: boolean;
  height: Animation;
  content: Animation;
};

export function useCareerDisclosureAnimation(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Map<HTMLDetailsElement, DisclosureAnimation>();
    const sync = (details: HTMLDetailsElement, expanded: boolean) => {
      const summary = details.querySelector("summary");
      const body = details.querySelector<HTMLElement>(".career-entry-body");
      summary?.setAttribute("aria-expanded", String(expanded));
      if (body) {
        body.inert = !expanded;
        if (expanded) body.removeAttribute("aria-hidden");
        else body.setAttribute("aria-hidden", "true");
      }
    };
    const settle = (details: HTMLDetailsElement, state: DisclosureAnimation) => {
      if (animations.get(details) !== state) return;
      details.open = state.expanded;
      state.height.cancel();
      state.content.cancel();
      animations.delete(details);
      delete details.dataset.careerAnimating;
      delete details.dataset.careerExpanded;
      sync(details, state.expanded);
    };
    const settleAll = () => {
      animations.forEach((state, details) => settle(details, state));
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      const summary = target?.closest<HTMLElement>(".career-entry > summary");
      const details = summary?.parentElement;
      const body = details?.querySelector<HTMLElement>(".career-entry-body");
      if (!(details instanceof HTMLDetailsElement) || !summary || !body || !root.contains(details)) return;
      event.preventDefault();

      const previous = animations.get(details);
      const expanded = !(previous?.expanded ?? details.open);
      const startHeight = details.offsetHeight;
      const startOpacity = details.open ? Number(getComputedStyle(body).opacity) : 0;
      previous?.height.cancel();
      previous?.content.cancel();
      animations.delete(details);

      if (body.contains(document.activeElement)) summary.focus();
      sync(details, expanded);
      if (motion.matches || typeof details.animate !== "function") {
        details.open = expanded;
        delete details.dataset.careerAnimating;
        delete details.dataset.careerExpanded;
        return;
      }

      // Keep native details open until the closing animation has finished.
      details.dataset.careerAnimating = "true";
      details.dataset.careerExpanded = String(expanded);
      details.open = true;
      const styles = getComputedStyle(details);
      const collapsedHeight = summary.offsetHeight
        + parseFloat(styles.borderTopWidth)
        + parseFloat(styles.borderBottomWidth)
        + parseFloat(styles.paddingTop)
        + parseFloat(styles.paddingBottom);
      const endHeight = expanded ? details.offsetHeight : collapsedHeight;
      const options: KeyframeAnimationOptions = {
        duration: expanded ? 360 : 300,
        easing: "cubic-bezier(.22, 1, .36, 1)",
        fill: "both",
      };
      const state: DisclosureAnimation = {
        expanded,
        height: details.animate([
          { height: `${startHeight}px` },
          { height: `${endHeight}px` },
        ], options),
        content: body.animate([
          { opacity: startOpacity },
          { opacity: expanded ? 1 : 0 },
        ], options),
      };
      animations.set(details, state);
      // Cancellation from a rapid re-click must not finish the replacement.
      void state.height.finished.then(
        () => settle(details, state),
        () => settle(details, state),
      );
    };
    const handleToggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.matches(".career-entry") || animations.has(details)) return;
      sync(details, details.open);
    };
    const mutations = new MutationObserver(() => {
      animations.forEach((state, details) => {
        if (!root.contains(details)) settle(details, state);
      });
    });
    mutations.observe(root, { childList: true, subtree: true });
    // Locale changes can alter the measured content height mid-animation.
    const localeChanges = new MutationObserver(settleAll);
    localeChanges.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-locale"],
    });
    root.addEventListener("click", handleClick);
    root.addEventListener("toggle", handleToggle, true);
    window.addEventListener("resize", settleAll, { passive: true });
    motion.addEventListener("change", settleAll);
    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("toggle", handleToggle, true);
      window.removeEventListener("resize", settleAll);
      motion.removeEventListener("change", settleAll);
      mutations.disconnect();
      localeChanges.disconnect();
      settleAll();
    };
  }, [rootRef]);
}
