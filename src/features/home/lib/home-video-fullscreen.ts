/** Keep native fullscreen on a stable ancestor, not ScrollTrigger's moved pin. */
export function getWorkspaceFullscreenTarget(host: HTMLElement): HTMLElement {
  return host.closest<HTMLElement>("[data-home-chapter=\"workspace\"]") ?? host;
}

export function isHomeVideoFullscreen(element: Element | null): boolean {
  if (!element || typeof document === "undefined") return false;
  const fullscreen = document.fullscreenElement
    ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
  if (fullscreen?.matches("[data-home-chapter=\"workspace\"]")) return true;
  return Boolean(fullscreen && (fullscreen.contains(element) || element.contains(fullscreen))
    || element.closest("[data-home-video-fullscreen=\"true\"]"));
}
