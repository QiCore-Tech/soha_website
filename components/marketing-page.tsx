import type { ReactNode } from "react";

type MarketingPageProps = {
  eyebrow: { zh: string; en: string };
  title: { zh: string; en: string };
  intro: { zh: string; en: string };
  children: ReactNode;
};

export function MarketingPage({ eyebrow, title, intro, children }: MarketingPageProps) {
  return (
    <main className="marketing-page">
      <div className="marketing-board">
        <section className="marketing-hero">
          <div className="marketing-hero-copy">
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
          <div className="company-hero-art" aria-hidden="true">
            <div className="company-blueprint-card">
              <span className="company-art-index">QICORE / 001</span>
              <strong><i>Qi</i>Core</strong>
              <span className="company-art-axis axis-x" />
              <span className="company-art-axis axis-y" />
              <span className="company-art-block block-one" />
              <span className="company-art-block block-two" />
              <span className="company-art-block block-three" />
            </div>
          </div>
        </section>

        {children}

        <footer className="marketing-footer">
          <div>
            <strong>QiCore Technology</strong>
            <p>
              <span data-lang="zh">让智能硬件更容易被创造。</span>
              <span data-lang="en">Make intelligent hardware easier to create.</span>
            </p>
          </div>
          <div className="marketing-footer-links">
            <a href="mailto:info@qicore.ai">info@qicore.ai</a>
            <a href="mailto:hr@qicore.ai">hr@qicore.ai</a>
            <a href="/oyscat">OysCat Products</a>
          </div>
          <small>© {new Date().getFullYear()} QiCore Technology. All rights reserved.</small>
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
