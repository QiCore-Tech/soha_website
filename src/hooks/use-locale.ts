"use client";

import { useEffect, useSyncExternalStore } from "react";
import { syncLocaleDocument } from "@/i18n/dom";
import { getLocale, getServerLocale, subscribeLocale, toggleLocale } from "@/stores/locale-store";

export function useLocale() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getServerLocale);
  useEffect(() => { syncLocaleDocument(getLocale()); }, [locale]);
  return { locale, toggleLocale };
}
