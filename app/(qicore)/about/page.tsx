import { BilingualText, MarketingPage } from "@/components/marketing-page";
import { OysCatProductWordmark } from "@/components/oyscat-product-wordmark";

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
      eyebrow={{ zh: "关于 QiCore", en: "About QiCore" }}
      title={{ zh: "让智能硬件，更容易被创造。", en: "Make intelligent hardware easier to create." }}
      intro={{
        zh: "QiCore 气核科技是一家面向下一代智能硬件的产品与技术公司。我们把设计、工程和制造放在同一条创造路径上。",
        en: "QiCore is a product and technology company for the next generation of intelligent hardware, bringing design, engineering, and manufacturing into one creative path."
      }}
    >
      <section className="marketing-section about-manifesto company-manifesto">
        <p className="section-kicker">Our direction</p>
        <div className="manifesto-grid">
          <h2><BilingualText zh="从一个想法，到一个真实工作的产品。" en="From an idea to a product that truly works." /></h2>
          <div>
            <p>
              <BilingualText
                zh="智能硬件的创造不应被学科和工具割裂。QiCore 关注完整产品，而不是孤立的技术环节；我们用长期研发和具体交付推动每一次进步。"
                en="Creating intelligent hardware should not be fragmented by disciplines and tools. QiCore focuses on complete products, combining long-term research with concrete delivery."
              />
            </p>
            <a className="company-cta" href="/oyscat">
              <BilingualText
                zh={
                  <span className="company-cta-brand-label">
                    <span>了解首个产品</span>
                    <OysCatProductWordmark className="qicore-inline-oyscat-wordmark" />
                  </span>
                }
                en={
                  <span className="company-cta-brand-label">
                    <span>Discover</span>
                    <OysCatProductWordmark className="qicore-inline-oyscat-wordmark" />
                  </span>
                }
              />
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <section className="capability-grid marketing-section" aria-label="QiCore capabilities">
        {capabilities.map((capability) => (
          <article className="capability-card" key={capability.number}>
            <span>{capability.number}</span>
            <h3><BilingualText zh={capability.zh} en={capability.en} /></h3>
            <p><BilingualText zh={capability.detailZh} en={capability.detailEn} /></p>
          </article>
        ))}
      </section>

      <section className="hardware-strip company-product-strip marketing-section">
        <div className="hardware-copy">
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
          <a className="company-cta dark" href="/oyscat">
            <BilingualText zh="进入产品站" en="Enter product site" />
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="company-product-identity">
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
