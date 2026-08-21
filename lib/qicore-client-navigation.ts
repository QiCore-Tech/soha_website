const QICORE_CONTENT_ROUTES = ["/about", "/news", "/team"] as const;
const QICORE_ROUTES = new Set<string>(["/", ...QICORE_CONTENT_ROUTES]);
const routeHtmlCache = new Map<string, string>();

export function isQiCoreRoute(pathname: string) {
  return QICORE_ROUTES.has(pathname);
}

export function getCachedQiCoreRouteHtml(pathname: string) {
  return routeHtmlCache.get(pathname) ?? null;
}

export function setCachedQiCoreRouteHtml(pathname: string, html: string) {
  if (!QICORE_ROUTES.has(pathname) || pathname === "/" || !html) return;
  routeHtmlCache.set(pathname, html);
}

export async function loadQiCoreRouteHtml(pathname: string) {
  const cached = getCachedQiCoreRouteHtml(pathname);
  if (cached) return cached;
  if (!QICORE_ROUTES.has(pathname) || pathname === "/") return null;

  const response = await fetch(pathname, {
    credentials: "same-origin",
    headers: { Accept: "text/html" },
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) {
    throw new Error(`Expected an HTML document for ${pathname}`);
  }

  const documentHtml = await response.text();
  const parsedDocument = new DOMParser().parseFromString(documentHtml, "text/html");
  const activePanel = parsedDocument.querySelector<HTMLElement>(".qicore-route-panel.is-active");
  if (!activePanel) throw new Error(`Missing QiCore route panel for ${pathname}`);

  const html = activePanel.innerHTML;
  setCachedQiCoreRouteHtml(pathname, html);
  return html;
}

export function preloadQiCoreRouteHtml() {
  return Promise.allSettled(QICORE_CONTENT_ROUTES.map((pathname) => loadQiCoreRouteHtml(pathname)));
}
