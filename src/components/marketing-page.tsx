import type { ReactNode } from "react";
import { PageHero, type HeroAction } from "@/components/page-hero";
import type { LocalizedText } from "@/types/locale";

type MarketingPageProps = {
  eyebrow: LocalizedText;
  title: LocalizedText | ReactNode;
  intro: LocalizedText;
  image?: {
    src: string;
    smallSrc?: string;
    width: number;
    height: number;
    position?: string;
    smallPosition?: string;
  };
  tone?: "dark" | "light";
  backdrop?: string;
  actions?: HeroAction[];
  showHero?: boolean;
  pageClassName?: string;
  children: ReactNode;
};

/**
 * Page shell shared by every inner route. `.marketing-page` and
 * `.marketing-board` stay in the markup because the cached-route shell and the
 * browser tests both key off them.
 */
export function MarketingPage({
  eyebrow,
  title,
  intro,
  image,
  tone = "light",
  backdrop,
  actions,
  showHero = true,
  pageClassName,
  children
}: MarketingPageProps) {
  return (
    <main className={`marketing-page${pageClassName ? ` ${pageClassName}` : ""}`}>
      <div className="marketing-board" id="top">
        {showHero ? (
          <PageHero
            eyebrow={eyebrow}
            title={title}
            intro={intro}
            image={image}
            tone={tone}
            backdrop={backdrop}
            actions={actions}
            titleId="page-hero-title"
          />
        ) : null}
        {children}
      </div>
    </main>
  );
}

export { BilingualText } from "@/components/bilingual-text";
