
import { messages } from "@/i18n/messages";
import type { Locale } from "@/types/locale";

export const DEFAULT_LOCALE: Locale = "zh";
export function normalizeLocale(value: unknown): Locale {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}
export const localeLabels = messages.config.switchToChinese;
