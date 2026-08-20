import { BilingualText, MarketingPage } from "@/components/marketing-page";

export default function TeamPage() {
  return (
    <MarketingPage
      eyebrow={{ zh: "团队与职业", en: "Team & Careers" }}
      title={{ zh: "和真正好奇的人，一起创造。", en: "Build with the truly curious." }}
      intro={{
        zh: "我们是一支把设计、工程与制造放在同一张桌上的团队。我们相信好奇心、判断力，以及把复杂问题做得简单。",
        en: "We bring design, engineering, and manufacturing to the same table. We value curiosity, judgment, and making complex things feel simple."
      }}
    >
      <section className="marketing-section values-grid">
        <article>
          <span>01</span>
          <h2><BilingualText zh="跨过边界" en="Cross boundaries" /></h2>
          <p><BilingualText zh="产品不按学科切割，我们也不会。" en="Products are not divided by discipline, and neither are we." /></p>
        </article>
        <article>
          <span>02</span>
          <h2><BilingualText zh="保持具体" en="Stay concrete" /></h2>
          <p><BilingualText zh="用原型、数据和真实使用来推进讨论。" en="Move discussions forward with prototypes, data, and real use." /></p>
        </article>
        <article>
          <span>03</span>
          <h2><BilingualText zh="长期创造" en="Create for the long run" /></h2>
          <p><BilingualText zh="为今天交付，也为下一次突破积累。" en="Deliver today while compounding toward the next breakthrough." /></p>
        </article>
      </section>

      <section className="marketing-section careers-panel">
        <div>
          <p className="section-kicker">Join QiCore</p>
          <h2><BilingualText zh="下一位创造者，会是你吗？" en="Could the next creator be you?" /></h2>
        </div>
        <div>
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
