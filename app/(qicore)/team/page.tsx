import { BilingualText, MarketingPage } from "@/components/marketing-page";

export default function TeamPage() {
  return (
    <MarketingPage
      heroArt="workbench"
      eyebrow={{ zh: "团队与职业", en: "Team & Careers" }}
      title={{ zh: "和真正好奇的人，一起创造。", en: "Create with the Truly Curious" }}
      intro={{
        zh: "我们是一支把设计、工程与制造放在同一张桌上的团队。我们相信好奇心、判断力，以及把复杂问题做得简单。",
        en: "Founded in January 2026, QiCore Technology is building the infrastructure for AI-driven physical creation."
      }}
    >
      <section className="marketing-section team-mission-section" data-lang="en" data-qicore-waterfall="2">
        <div className="team-mission-visual" aria-hidden="true">
          <span className="team-mission-record">QICORE / MISSION 01</span>
          <span className="team-mission-number">01</span>
          <svg className="team-mission-flow" viewBox="0 0 280 360" role="presentation">
            <g className="mission-intent-block">
              <text x="76" y="26">DIGITAL / INTENT</text>
              <rect x="68" y="48" width="144" height="76" rx="2" />
              <circle cx="96" cy="86" r="7" />
              <path d="M116 72h68M116 87h50M116 102h34" />
            </g>
            <path className="mission-flow-line" d="M140 124C140 158 109 160 109 188S140 214 140 238" />
            <g className="mission-flow-nodes">
              <circle cx="140" cy="148" r="4" />
              <circle cx="109" cy="188" r="4" />
              <circle cx="134" cy="224" r="4" />
            </g>
            <g className="mission-object-block">
              <polygon className="mission-object-front" points="102,254 168,254 168,320 102,320" />
              <polygon className="mission-object-top" points="102,254 132,232 198,232 168,254" />
              <polygon className="mission-object-side" points="168,254 198,232 198,298 168,320" />
              <circle cx="119" cy="301" r="3" />
              <circle cx="133" cy="301" r="3" />
              <circle cx="147" cy="301" r="3" />
              <text x="85" y="348">PHYSICAL / OBJECT</text>
            </g>
            <path className="mission-ground-line" d="M50 332H228" />
          </svg>
        </div>

        <div className="team-mission-copy">
          <p className="section-kicker">Our mission</p>
          <p className="team-mission-lead">Our mission is to extend AI&apos;s scope from the digital world into the physical world.</p>
          <p>We believe the ability to create real objects should not belong only to large companies or specialized engineering teams. It should be accessible to anyone with an idea.</p>
        </div>
      </section>

      <section className="marketing-section values-grid">
        <article data-qicore-waterfall="3">
          <span>01</span>
          <h2><BilingualText zh="跨过边界" en="Cross boundaries" /></h2>
          <p><BilingualText zh="产品不按学科切割，我们也不会。" en="Products are not divided by discipline, and neither are we." /></p>
        </article>
        <article data-qicore-waterfall="4">
          <span>02</span>
          <h2><BilingualText zh="保持具体" en="Stay concrete" /></h2>
          <p><BilingualText zh="用原型、数据和真实使用来推进讨论。" en="Move discussions forward with prototypes, data, and real use." /></p>
        </article>
        <article data-qicore-waterfall="5">
          <span>03</span>
          <h2><BilingualText zh="长期创造" en="Create for the long run" /></h2>
          <p><BilingualText zh="为今天交付，也为下一次突破积累。" en="Deliver today while compounding toward the next breakthrough." /></p>
        </article>
      </section>

      <section className="marketing-section careers-panel">
        <div data-qicore-waterfall="6">
          <p className="section-kicker">Join QiCore</p>
          <h2><BilingualText zh="下一位创造者，会是你吗？" en="Could the next creator be you?" /></h2>
        </div>
        <div data-qicore-waterfall="7">
          <p>
            <BilingualText
              zh="具体职位将陆续更新。你也可以直接把作品、经历和你最想解决的问题发给我们。"
              en="Open roles will be published here. You can also send us your work, experience, and the problem you most want to solve."
            />
          </p>
          <a className="lime-cta" href="mailto:hr@qicore.ai">
            hr@qicore.ai <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </MarketingPage>
  );
}
