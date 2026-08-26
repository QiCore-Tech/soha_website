import { BilingualText, MarketingPage } from "@/components/marketing-page";
import { OysCatProductWordmark } from "@/components/oyscat-product-wordmark";
import { QiCoreFilm } from "@/components/qicore-film";

export default function AboutPage() {
  return (
    <MarketingPage
      heroArt="system"
      pageClassName="about-page"
      eyebrow={{ zh: "关于 QiCore", en: "About QiCore" }}
      title={{ zh: "让想法成真", en: "Make Ideas Real." }}
      intro={{
        zh: "QiCore 正在搭建一套从意图到实物的创作系统，让更多人能够亲手做出自己的作品。",
        en: "QiCore is building a creation system that takes an idea from intent to object—so more people can make something of their own."
      }}
    >
      <QiCoreFilm />

      <section className="marketing-section about-narrative">
        <p className="section-kicker" data-qicore-waterfall="2">Why QiCore</p>
        <div className="about-narrative-layout" data-lang="zh">
          <div className="about-narrative-statement" data-qicore-waterfall="2">
            <div className="about-narrative-transition" aria-hidden="true">
              <span>DIGITAL</span><i /><span>PHYSICAL</span>
            </div>
            <h2>在 QiCore，<span>指令的终点</span>，就是物理世界。</h2>
            <div className="about-narrative-blocks" aria-hidden="true"><i /><i /><i /></div>
          </div>
          <ol className="about-narrative-copy" data-qicore-waterfall="3">
            <li><span>01 / DIGITAL</span><strong>数字创作，触手可及</strong><p>如今，一句指令就能生成代码、设计图和 3D 模型。</p></li>
            <li><span>02 / PHYSICAL</span><strong>到了现实，门槛仍然很高</strong><p>从概念到实物，需要跨越机械、电子、编程和制造工艺等多个专业领域。</p></li>
            <li className="is-qicore"><span>03 / QICORE</span><strong>让 AI 走进物理世界</strong><p>让每个创意都有机会成为实体，从一个想法开始，直接驱动制造终端。</p></li>
          </ol>
        </div>
        <div className="about-narrative-layout" data-lang="en">
          <div className="about-narrative-statement" data-qicore-waterfall="2">
            <div className="about-narrative-transition" aria-hidden="true">
              <span>DIGITAL</span><i /><span>PHYSICAL</span>
            </div>
            <h2>Prompt the <span>Physical World.</span></h2>
            <div className="about-narrative-blocks" aria-hidden="true"><i /><i /><i /></div>
          </div>
          <ol className="about-narrative-copy" data-qicore-waterfall="3">
            <li><span>01 / DIGITAL</span><strong>Digital creation is now within reach</strong><p>A single prompt can already generate code, designs, and 3D models.</p></li>
            <li><span>02 / PHYSICAL</span><strong>Physical creation tells a very different story</strong><p>Turning an idea into something tangible still demands expertise in mechanics, electronics, programming, and often manufacturing processes. For non-experts, the barrier remains steep.</p></li>
            <li className="is-qicore"><span>03 / QICORE</span><strong>From intent to reality</strong><p>QiCore is here to rewrite that equation. Digital creation is already open to everyone. Physical creation should be too.</p></li>
          </ol>
        </div>
      </section>

      <section className="marketing-section about-vision-appendix">
        <div className="about-vision-diagram" aria-hidden="true">
          <svg viewBox="0 0 280 248" role="presentation">
            <g className="field-note-intent">
              <rect x="20" y="26" width="106" height="72" rx="2" />
              <circle cx="43" cy="62" r="7" />
              <path d="M61 49h46M61 63h34M61 77h23" />
              <path className="field-note-corner" d="M20 40V26h14M112 26h14v14" />
            </g>
            <path className="field-note-connector" d="M126 62h35m0 0-8-6m8 6-8 6" />
            <g className="field-note-object">
              <polygon className="field-note-object-front" points="160,119 219,119 219,178 160,178" />
              <polygon className="field-note-object-top" points="160,119 184,101 243,101 219,119" />
              <polygon className="field-note-object-side" points="219,119 243,101 243,160 219,178" />
              <rect x="178" y="140" width="23" height="18" rx="1" />
              <circle cx="184" cy="149" r="2.5" />
              <circle cx="193" cy="149" r="2.5" />
              <circle cx="202" cy="149" r="2.5" />
            </g>
            <path className="field-note-baseline" d="M48 202h166" />
            <path className="field-note-accent" d="M52 202h34" />
          </svg>
          <span>INTENT → PHYSICAL OBJECT</span>
        </div>
        <div data-lang="zh">
          <p>数字世界的创作与物理世界之间，隔着一条鸿沟。在屏幕上生成一份作品，和向物理世界下发指令并产出实物，完全是两码事。对于缺乏专业背景的人来说，这道门槛依旧高不可攀。</p>
          <p>我们所要做的，正是让 AI 的能力延伸至物理世界，赋予每个人“以意图造物”的权利。大至复杂的现实装置，小至触手可及的日常物件，无论功能繁简、形态各异，每一个创意都应有机会成为实体。过去，制造依赖经年累月的训练；未来，它只从一个想法开始，便能跨过重重壁垒，直接驱动制造终端。</p>
          <p>我们正全力以赴将愿景化为现实，让创想与实物之间，天堑变通途。</p>
        </div>
        <div data-lang="en">
          <p>Complex creations or simple objects. Complex functions or none at all. QiCore reasons for its form and its function, and turns that intent into an object you can hold.</p>
          <p>Here is the equation we believe in:</p>
          <p>Expertise required + years of training = the old way in.<br />Intent alone = the new one.</p>
          <p>For decades, making things belonged to a few: engineers, manufacturers, specialists holding knowledge the rest of us couldn&apos;t access. That knowledge was real, and it was necessary. But necessity doesn&apos;t mean exclusivity.</p>
          <p>The wall between imagining something and building it was never meant to be permanent. It was only ever a limit of the tools we had.</p>
          <p>With QiCore, creation starts with a single thing: your intent.</p>
        </div>
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
              zh="OysCat 是 QiCore 推出的首款造物系统，面向每一个想把想法做出来的人。"
              en="OysCat is QiCore's first product family, made for anyone who wants to turn an idea into something real."
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
