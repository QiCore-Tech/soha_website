"use client";

import { useEffect } from "react";

/**
 * Keep the news card itself passive: only the explicit read button toggles
 * the native details element. The delegated setup also survives route swaps
 * handled by the QiCore shell.
 */
export function NewsEntryInteraction() {
  useEffect(() => {
    const entries = Array.from(document.querySelectorAll<HTMLDetailsElement>(".news-entry"));
    const cleanups = entries.map((entry) => {
      const toggle = entry.querySelector<HTMLButtonElement>(".news-entry-toggle");
      if (!toggle) return () => {};

      const handleToggle = (event: MouseEvent) => {
        event.preventDefault();
        entry.open = !entry.open;
      };

      toggle.addEventListener("click", handleToggle);
      return () => toggle.removeEventListener("click", handleToggle);
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
