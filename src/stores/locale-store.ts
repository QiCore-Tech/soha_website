"use client";

import { LOCALE_STORAGE_KEY } from "@/constants/storage";
import { DEFAULT_LOCALE, normalizeLocale } from "@/i18n/config";
import { syncLocaleDocument } from "@/i18n/dom";
import type { Locale } from "@/types/locale";

const listeners = new Set<() => void>();
export function getLocale(): Locale {
  return typeof document === "undefined" ? DEFAULT_LOCALE : normalizeLocale(document.documentElement.dataset.locale);
}
export function getServerLocale(): Locale { return DEFAULT_LOCALE; }

export function setLocale(locale: Locale) {
  // 存储被禁用时，DOM 与当前会话仍可正常切换。
  try { window.localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch {}
  syncLocaleDocument(locale);
  listeners.forEach((listener) => listener());
}
function handleStorage(event: StorageEvent) {
  if (event.key !== LOCALE_STORAGE_KEY && event.key !== null) return;
  syncLocaleDocument(normalizeLocale(event.newValue));
  listeners.forEach((listener) => listener());
}
export function subscribeLocale(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", handleStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
  };
}
export function toggleLocale() { setLocale(getLocale() === "zh" ? "en" : "zh"); }
