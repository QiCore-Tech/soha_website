import catalog from "./messages.json";
import type { Locale, LocalizedText } from "@/types/locale";

export const messages = catalog;

export const localeCssProperties: Record<Locale, Record<string, string>> = {
  zh: Object.fromEntries(Object.entries(messages.cssLabels).map(([key, text]) => [`--i18n-${key}`, JSON.stringify(text.zh)])),
  en: Object.fromEntries(Object.entries(messages.cssLabels).map(([key, text]) => [`--i18n-${key}`, JSON.stringify(text.en)])),
};

export const pageTitles: Record<string, LocalizedText> = {
  "/": messages.pageTitles.qicoreTechnologyThinkItMakeIt,
  "/about": messages.pageTitles.aboutUsQicore,
  "/careers": messages.pageTitles.careersQicore,
  "/news": messages.pageTitles.newsQicore,
};

export const pageDescriptions: Record<string, LocalizedText> = {
  "/": messages.seo.defaultDescription,
  "/about": messages.seo.aboutDescription,
  "/careers": messages.seo.careersDescription,
  "/news": messages.seo.newsDescription,
};

export function formatMessage(text: LocalizedText, locale: Locale, values: Record<string, string | number>) {
  return text[locale].replace(/\{(\w+)\}/g, (token, key: string) => String(values[key] ?? token));
}
