import { BilingualText, MarketingPage } from "@/components/marketing-page";
import { OysCatProductWordmark } from "@/components/oyscat-product-wordmark";
import { QiCoreFilm } from "@/components/qicore-film";

const capabilities = [
  {
    number: "01",
    zh: "产品与体验",
    en: "Product & experience",
    detailZh: "从真实使用场景出发，把复杂技术组织成清晰、自然的产品体验。",
    detailEn: "Turn complex technologies into clear, natural product experiences grounded in real use."
  },
  {
    number: "02",
    zh: "软硬件工程",
    en: "Software & hardware",
    detailZh: "让电子、结构、嵌入式与软件在同一条产品路径上协同推进。",
    detailEn: "Advance electronics, mechanics, embedded systems, and software along one product path."
  },
  {
    number: "03",
    zh: "验证与制造",
    en: "Validation & manufacturing",
    detailZh: "持续连接设计、原型、验证与制造，把创意推进到可交付的现实。",
    detailEn: "Connect design, prototyping, validation, and manufacturing to make ideas deliverable."
  }
];

export default function AboutPage() {
  return (
    <MarketingPage
      heroArt="system"
      pageClassName="about-page"
      eyebrow={{ zh: "关于 QiCore", en: "About QiCore" }}
      title={{ zh: "让智能硬件，更容易被创造。", en: "Make Physical Products by Simply Describing What You Want" }}
      intro={{
        zh: "QiCore 气核科技是一家面向下一代智能硬件的产品与技术公司。我们把设计、工程和制造放在同一条创造路径上。",
        en: "QiCore is bringing a new way to build in the physical world: simply describe what you want."
      }}
    >
      <QiCoreFilm />

      <section className="marketing-section about-narrative">
        <p className="section-kicker" data-qicore-waterfall="2">Why QiCore</p>
        <div className="about-narrative-layout" data-lang="zh">
          <h2 data-qicore-waterfall="2">从一个想法，到一个真实工作的产品。</h2>
          <div className="about-narrative-copy" data-qicore-waterfall="3">
            <p>智能硬件的创造不应被学科和工具割裂。QiCore 关注完整产品，而不是孤立的技术环节。</p>
            <p>我们把设计、工程和制造放在同一条创造路径上，用长期研发和具体交付推动每一次进步。</p>
          </div>
        </div>
        <div className="about-narrative-layout" data-lang="en">
          <h2 data-qicore-waterfall="2">Physical manufacturing, however, is a different story.</h2>
          <div className="about-narrative-copy" data-qicore-waterfall="3">
            <p>Generative AI has put digital creation within everyone&apos;s reach. A single prompt can now generate code, designs, and any form of digital content.</p>
            <p>Building something in the real world requires knowledge of mechanics, electronics, programming, and often manufacturing know-how. For non-experts, the barrier to physical creation remains high.</p>
            <p><strong>QiCore is changing this.</strong> We are bringing a new way to build in the physical world: simply describe what you want.</p>
          </div>
        </div>
      </section>

      <section className="capability-grid marketing-section" data-lang="zh" aria-label="QiCore capabilities">
        {capabilities.map((capability, index) => (
          <article className="capability-card" data-qicore-waterfall={index + 4} key={capability.number}>
            <span>{capability.number}</span>
            <h3><BilingualText zh={capability.zh} en={capability.en} /></h3>
            <p><BilingualText zh={capability.detailZh} en={capability.detailEn} /></p>
          </article>
        ))}
      </section>

      <section className="hardware-strip company-product-strip marketing-section">
        <div className="hardware-copy" data-qicore-waterfall="4">
          <p className="section-kicker">Our first product</p>
          <h2>
            <BilingualText
              zh={
                <span className="company-product-heading">
                  <span className="company-product-heading-brand">
                    <OysCatProductWordmark className="qicore-heading-oyscat-wordmark" />
                  </span>
                  <span>，是我们迈出的第一步。</span>
                </span>
              }
              en={
                <span className="company-product-heading">
                  <span className="company-product-heading-brand">
                    <OysCatProductWordmark className="qicore-heading-oyscat-wordmark" />
                  </span>
                  <span>is our first step.</span>
                </span>
              }
            />
          </h2>
          <p className="company-product-summary">
            <BilingualText
              zh="由模块化电子硬件与 AI 创造工作空间组成，让真实造物更容易开始。"
              en="A modular electronics system and AI creation workspace that make building in the physical world easier to begin."
            />
          </p>
          <a className="company-cta dark" href="/oyscat">
            <BilingualText zh="进入产品站" en="Enter product site" />
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="company-product-identity" data-qicore-waterfall="5">
          <span className="company-product-code">
            PRODUCT 01 /
            <OysCatProductWordmark className="qicore-code-oyscat-wordmark" decorative />
          </span>
          <div className="company-product-emblem">
            <img src="/brand/oyscat-cat-head-whiskers.svg" alt="" aria-hidden="true" />
          </div>
          <div className="company-product-word">
            <OysCatProductWordmark className="qicore-display-oyscat-wordmark" />
          </div>
        </div>
      </section>

    </MarketingPage>
  );
}
