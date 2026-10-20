import type { CSSProperties, ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { BilingualText as Bi } from "@/components/bilingual-text";
import type { LocalizedText } from "@/types/locale";

export type HeroAction = {
  href: string;
  label: LocalizedText;
  /** Primary is the filled capsule; secondary is the outline capsule. */
  emphasis?: "primary" | "secondary";
  external?: boolean;
};

type PageHeroProps = {
  eyebrow?: LocalizedText;
  /** Plain bilingual text, or a node when the title needs manual line breaks. */
  title: LocalizedText | ReactNode;
  intro?: LocalizedText;
  /** Omit for a text-only hero; the height is the same either way. */
  image?: {
    src: string;
    /** Narrower source used below 768px. */
    smallSrc?: string;
    width: number;
    height: number;
    /** CSS object-position for the full-bleed desktop crop. */
    position?: string;
    /** CSS object-position for the stacked mobile crop. */
    smallPosition?: string;
  };
  /** Dark imagery gets white type; light imagery gets ink type. */
  tone?: "dark" | "light";
  /** Matches the image's own backdrop so the stacked mobile layout has no seam. */
  backdrop?: string;
  actions?: HeroAction[];
  titleId?: string;
  children?: ReactNode;
};

function isLocalized(value: unknown): value is LocalizedText {
  return typeof value === "object" && value !== null && "zh" in value && "en" in value;
}

export function heroActionClass(emphasis: HeroAction["emphasis"], tone: "dark" | "light") {
  const variant = tone === "dark"
    ? emphasis === "secondary" ? "pill-outline-inverse" : "pill-inverse"
    : emphasis === "secondary" ? "pill-outline" : "pill";
  return buttonVariants({ variant, size: "pill" });
}

/**
 * Full-bleed image hero in the DJI pattern: small category line, bold title,
 * one-line slogan and up to two capsule actions. On phones the copy stacks
 * above the image so a landscape product shot is never cropped behind text.
 *
 * Heights follow the viewport rather than a pixel cap, so 16:9 and 16:10
 * screens frame the first screen the same way. Every hero, with or without an
 * image, takes a little under half of it so inner pages open at one compact height.
 */
export function PageHero({ eyebrow, title, intro, image, tone = "light", backdrop, actions = [], titleId, children }: PageHeroProps) {
  const isDark = tone === "dark";
  return (
    <section
      className={`relative isolate flex flex-col overflow-hidden md:flex-row md:items-center md:min-h-[clamp(340px,40svh,520px)] ${isDark ? "text-white" : "text-ink"}`}
      style={{ backgroundColor: backdrop ?? (isDark ? "#000000" : "#f5f5f5") }}
      aria-labelledby={titleId}
    >
      <div className="site-container relative z-10 pt-14 pb-10 md:py-12" data-qicore-waterfall="0">
        <div className="max-w-xl">
          {eyebrow ? (
            <p className={`eyebrow ${isDark ? "text-white/70" : "text-ink-3"}`}><Bi zh={eyebrow.zh} en={eyebrow.en} /></p>
          ) : null}
          <h1 id={titleId} className="mt-3 font-heading text-display font-semibold tracking-tight">
            {isLocalized(title) ? <Bi zh={title.zh} en={title.en} /> : title}
          </h1>
          {intro ? (
            <p className={`mt-5 max-w-lg text-lead ${isDark ? "text-white/75" : "text-ink-2"}`}><Bi zh={intro.zh} en={intro.en} /></p>
          ) : null}
          {actions.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className={heroActionClass(action.emphasis, tone)}
                  {...(action.external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  <Bi zh={action.label.zh} en={action.label.en} />
                </a>
              ))}
            </div>
          ) : null}
          {children}
        </div>
      </div>
      {image ? (
        <picture className="relative block aspect-[4/3] w-full md:absolute md:inset-0 md:aspect-auto md:h-full">
          {image.smallSrc ? <source media="(width < 768px)" srcSet={image.smallSrc} /> : null}
          {/* Local static assets do not need an image optimization server. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover object-(--hero-small-position) md:object-(--hero-position)"
            style={{
              "--hero-position": image.position ?? "center",
              "--hero-small-position": image.smallPosition ?? image.position ?? "center",
            } as CSSProperties}
          />
        </picture>
      ) : null}
    </section>
  );
}
