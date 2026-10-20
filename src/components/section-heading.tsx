import { BilingualText as Bi } from "@/components/bilingual-text";
import type { LocalizedText } from "@/types/locale";

type SectionHeadingProps = {
  eyebrow?: LocalizedText;
  title: LocalizedText;
  lead?: LocalizedText;
  align?: "center" | "left";
  tone?: "dark" | "light";
  titleId?: string;
  /** Waterfall step used by the route entry choreography. */
  waterfall?: string;
};

export function SectionHeading({ eyebrow, title, lead, align = "center", tone = "light", titleId, waterfall = "1" }: SectionHeadingProps) {
  const isDark = tone === "dark";
  return (
    <header
      data-qicore-waterfall={waterfall}
      className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      {eyebrow ? (
        <p className={`eyebrow ${isDark ? "text-white/60" : "text-ink-3"}`}><Bi zh={eyebrow.zh} en={eyebrow.en} /></p>
      ) : null}
      <h2 id={titleId} className={`mt-3 font-heading text-title font-semibold tracking-tight ${isDark ? "text-white" : "text-ink"}`}>
        <Bi zh={title.zh} en={title.en} />
      </h2>
      {lead ? (
        <p className={`mt-5 text-lead ${isDark ? "text-white/70" : "text-ink-2"}`}>
          <Bi zh={lead.zh} en={lead.en} />
        </p>
      ) : null}
    </header>
  );
}
