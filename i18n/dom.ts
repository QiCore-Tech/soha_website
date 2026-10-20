import type { Locale } from "@/types/locale";
import { pageTitles, pageDescriptions, localeCssProperties } from "@/i18n/messages";

// 双语节点仍由全局 CSS 的 data-lang 协议显示；缓存 HTML 不依赖 React 重挂载。
export function syncLocaleDocument(locale: Locale) {
  const root = document.documentElement;
  root.dataset.locale = locale;
  root.lang = locale === "en" ? "en" : "zh-CN";
  for (const [property, value] of Object.entries(localeCssProperties[locale])) {
    root.style.setProperty(property, value);
  }
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const title = pageTitles[pathname];
  if (title) document.title = title[locale];
  const description = pageDescriptions[pathname];
  if (description) {
    document.querySelectorAll<HTMLMetaElement>('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]').forEach((node) => {
      node.setAttribute("content", description[locale]);
    });
  }
  if (title) {
    document.querySelectorAll<HTMLMetaElement>('meta[property="og:title"], meta[name="twitter:title"]').forEach((node) => {
      node.setAttribute("content", title[locale]);
    });
  }
  for (const attribute of ["aria-label", "aria-roledescription", "alt", "placeholder", "title", "content"] as const) {
    document.querySelectorAll<HTMLElement>(`[data-${attribute}-${locale}]`).forEach((node) => {
      node.setAttribute(attribute, node.getAttribute(`data-${attribute}-${locale}`) ?? "");
    });
  }
}
