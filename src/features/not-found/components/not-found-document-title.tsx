"use client";

import { useEffect } from "react";
import { messages } from "@/i18n/messages";
import { useLocale } from "@/hooks/use-locale";

/**
 * The nav and syncLocaleDocument look titles up by pathname, which a 404 does
 * not have, so the not-found page keeps its own title in step with the locale.
 */
export function NotFoundDocumentTitle() {
  const { locale } = useLocale();

  useEffect(() => {
    const localizedTitle = messages.pageTitles.notFoundQicore[locale];
    const applyLocalizedTitle = () => {
      if (document.title !== localizedTitle) document.title = localizedTitle;
    };

    applyLocalizedTitle();
    const observer = new MutationObserver(applyLocalizedTitle);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}
