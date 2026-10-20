import { ChevronRight } from "lucide-react";
import { BilingualText as Bi } from "@/components/bilingual-text";
import type { LocalizedText } from "@/types/locale";

/** DJI-style inline "learn more ›" link: brand-coloured text, no border. */
export function TextLink({ href, label, tone = "light", external = false }: {
  href: string;
  label: LocalizedText;
  tone?: "dark" | "light";
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center gap-1 text-[15px] font-medium underline-offset-4 hover:underline ${tone === "dark" ? "text-white" : "text-ink"}`}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <Bi zh={label.zh} en={label.en} />
      <ChevronRight size={16} aria-hidden="true" />
    </a>
  );
}
