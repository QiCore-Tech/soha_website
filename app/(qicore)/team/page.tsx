import { BilingualText, MarketingPage } from "@/components/marketing-page";

export default function TeamPage() {
  return (
    <MarketingPage
      pageClassName="team-page"
      heroArt="workbench"
      eyebrow={{ zh: "团队与职业", en: "Team & Careers" }}
      title={{ zh: "好奇，动手。", en: "Curious. Hands‑on." }}
      intro={{
        zh: "我们来自设计、工程、AI 和制造等不同领域。有人画图，有人写代码，也有人在工作台前反复调试。2026 年，我们为了同一个目标走到一起：让更多人都能把自己的想法做成现实。",
        en: "We come from design, engineering, AI, and manufacturing. Some of us sketch, some write code, and some keep testing at the workbench. In 2026, we came together around one goal: to help more people turn their ideas into something real."
      }}
    >
      <section className="marketing-section team-mission-section" data-qicore-waterfall="2">
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
          <p className="section-kicker"><BilingualText zh="我们为何出发" en="Why we build" /></p>
          <p className="team-mission-lead"><BilingualText zh="让每个想法，都有机会成真。" en="Give every idea a chance to become real." /></p>
          <p><BilingualText zh="AI 已经会写代码、画图、生成内容，但从屏幕上的想法到手里的实物，仍有一段路。我们想把这段路走通。造物不该只是大公司的专利，也不该只属于少数专业团队。只要有想法，就该有把它做出来的机会。" en="AI can already write code, draw images, and generate content. But there is still a gap between an idea on screen and a thing in your hands. We want to close it. Making should not be reserved for well-funded companies or specialist teams. If you have an idea, you should have a way to bring it to life." /></p>
        </div>
      </section>

      <section className="marketing-section values-grid">
        <article data-qicore-waterfall="3">
          <span>01</span>
          <h2><BilingualText zh="不拘一格" en="Cross boundaries" /></h2>
          <p><BilingualText zh="好产品不会困在一门学科里，我们也不会。" en="Good work does not stay in one discipline. Neither do we." /></p>
        </article>
        <article data-qicore-waterfall="4">
          <span>02</span>
          <h2><BilingualText zh="脚踏实地" en="Stay concrete" /></h2>
          <p><BilingualText zh="少一点空谈，多一点原型、数据和真实使用。" en="Less talk, more prototypes, data, and real use." /></p>
        </article>
        <article data-qicore-waterfall="5">
          <span>03</span>
          <h2><BilingualText zh="久久为功" en="Build for the long run" /></h2>
          <p><BilingualText zh="今天把事做好，也为明天多走一步。" en="Deliver today. Keep building for tomorrow." /></p>
        </article>
      </section>

      <section className="marketing-section careers-panel">
        <div data-qicore-waterfall="6">
          <p className="section-kicker"><BilingualText zh="加入 QiCore" en="Join QiCore" /></p>
          <h2><BilingualText zh="来 QiCore，一起把想法做出来。" en="Come build with QiCore." /></h2>
        </div>
        <div data-qicore-waterfall="7">
          <p>
            <BilingualText
              zh="我们正在寻找愿意认真解决问题、也愿意把想法做出来的人。查看开放职位和岗位要求，找到适合你的方向。"
              en="We are looking for thoughtful people who like turning ideas into real work. Explore our open roles and find where you could fit."
            />
          </p>
          <a className="lime-cta" href="/careers">
            <BilingualText zh="查看开放职位" en="View open roles" /> <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </MarketingPage>
  );
}
