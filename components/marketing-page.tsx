import type { ReactNode } from "react";
import { OysCatProductWordmark } from "@/components/oyscat-product-wordmark";
import {
  MarketingHeroArt,
  type MarketingHeroArtVariant
} from "@/components/marketing-hero-art";

type MarketingPageProps = {
  eyebrow: { zh: string; en: string };
  title: { zh: string; en: string };
  intro: { zh: string; en: string };
  heroArt?: MarketingHeroArtVariant;
  showHero?: boolean;
  pageClassName?: string;
  children: ReactNode;
};

export function MarketingPage({ eyebrow, title, intro, heroArt, showHero = true, pageClassName, children }: MarketingPageProps) {
  return (
    <main className={`marketing-page${pageClassName ? ` ${pageClassName}` : ""}`}>
      <div className="marketing-board">
        {showHero ? (
          <section className="marketing-hero">
            <div className="marketing-hero-copy" data-qicore-waterfall="0">
              <p className="marketing-eyebrow">
                <span data-lang="zh">{eyebrow.zh}</span>
                <span data-lang="en">{eyebrow.en}</span>
              </p>
              <h1>
                <span data-lang="zh">{title.zh}</span>
                <span data-lang="en">{title.en}</span>
              </h1>
              <p className="marketing-intro">
                <span data-lang="zh">{intro.zh}</span>
                <span data-lang="en">{intro.en}</span>
              </p>
            </div>
            {heroArt ? <MarketingHeroArt variant={heroArt} /> : null}
          </section>
        ) : null}

        {children}

        <footer className="marketing-footer">
          <div data-qicore-waterfall="7">
            <strong>QiCore Technology</strong>
            <p>
              <span data-lang="zh">气造万物</span>
              <span data-lang="en">MAKE SMART</span>
            </p>
          </div>
          <div className="marketing-footer-links" data-qicore-waterfall="8">
            <a href="mailto:info@qicore.ai">info@qicore.ai</a>
            <a href="/careers">
              <span data-lang="zh">查看招聘</span>
              <span data-lang="en">View openings</span>
            </a>
            <a href="mailto:hr@qicore.ai">hr@qicore.ai</a>
            <a className="marketing-footer-product" href="/oyscat">
              <OysCatProductWordmark className="qicore-footer-oyscat-wordmark" />
              <span data-lang="zh">产品</span>
              <span data-lang="en">Products</span>
            </a>
          </div>
          <small data-qicore-waterfall="8">© {new Date().getFullYear()} QiCore Technology. All rights reserved.</small>
        </footer>
      </div>
    </main>
  );
}

type BilingualTextProps = {
  zh: ReactNode;
  en: ReactNode;
};

export function BilingualText({ zh, en }: BilingualTextProps) {
  return (
    <>
      <span data-lang="zh">{zh}</span>
      <span data-lang="en">{en}</span>
    </>
  );
}
