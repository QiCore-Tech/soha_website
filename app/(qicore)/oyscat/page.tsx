import { OyscatImage } from "@/components/oyscat-image";
import { OyscatPixelScene } from "@/components/oyscat-pixel-scenes";
import { OyscatCompanion } from "@/components/oyscat-companion";
import type { Metadata } from "next";
import { ContentBeta } from "@/components/content-beta";
import { BilingualText as Bi, MarketingPage } from "@/components/marketing-page";
import styles from "./oyscat.module.css";

export const metadata: Metadata = {
  title: "Oyscat 产品",
  description: "Oyscat 将设计、仿真与标准化电子模块连接起来，让电气化造物更高效、更敏捷。",
};

const principles = [
  {
    index: "01 / DESIGN",
    zh: "AI 驱动的设计与仿真系统",
    en: "AI-powered design and simulation system with professional-level precision",
  },
  {
    index: "02 / MODULES",
    zh: "标准化、去中心化且可重复利用的电子模块",
    en: "Standardized, decentralized, and reusable electronic blocks",
  },
  {
    index: "03 / CREATION",
    zh: "赋能用户实现极致敏捷的电气化造物",
    en: "Empowering anyone to build electronic creations, fast and flexible",
  },
];

const faqs = [
  {
    zh: "如何开始使用 Oyscat？",
    en: "How can I get started with Oyscat?",
    answerZh: "先留下邮箱申请内测。团队筛选后，将为入选用户提供内测账号和体验安排。",
    answerEn: "Apply with your email. Selected applicants will receive a beta account and onboarding information from our team.",
  },
  {
    zh: "Oyscat 的独特之处？",
    en: "What makes Oyscat different?",
    answerZh: "造物过程像搭积木一样直观，并把设计、仿真与实体搭建连接在同一个系统中，让用户专注于想法本身。",
    answerEn: "Oyscat makes building as intuitive as assembling blocks, connecting design, simulation, and physical construction in one system.",
  },
  {
    zh: "电子模块如何连接虚拟与现实？",
    en: "How do electronic blocks connect the virtual and physical worlds?",
    answerZh: "工作台中的功能模块与实体电子模块相对应，帮助用户把虚拟设计转化为实际搭建。具体绑定、下载与运行能力以内测开放范围为准。",
    answerEn: "Workspace blocks correspond to physical electronic blocks. Binding, download, and runtime capabilities depend on the current beta release.",
  },
  {
    zh: "如何将工作台中的作品制作成实物？",
    en: "How can I turn a Workspace design into a physical creation?",
    answerZh: "根据作品设计准备结构件与电子模块，再完成装配和运行验证。当前支持的导出及制作流程将在内测指引中说明。",
    answerEn: "Prepare the structure and electronic blocks, then assemble and validate the creation. Supported export and fabrication workflows will be covered in the beta guide.",
  },
  {
    zh: "Oyscat 解决了哪些痛点？",
    en: "How does Oyscat help?",
    answerZh: "减少机械、电子和编程之间的重复开发与实物试错，让创作者更专注于作品功能和体验。",
    answerEn: "It reduces repetitive work across mechanics, electronics, and programming, along with the cost of physical trial and error.",
  },
];

function PixelCat({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" focusable="false" aria-hidden="true" shapeRendering="crispEdges">
    <path fill="#111" d="M4 2h3v2h2v3h6V4h2V2h3v8h2v8h-2v3h-4v1H8v-1H4v-3H2v-8h2Z" />
    <g fill="#A2E848"><path d="M7 11h2v4H7zm8 0h2v4h-2zM2 16h4v1H2zm16 0h4v1h-4zM4 19h3v1H4zm13 0h3v1h-3z" /></g>
  </svg>;
}

function ProductHeroVisual() {
  return (
    <div className={`company-hero-art ${styles.heroArt}`} data-qicore-waterfall="1">
      <div className={`company-blueprint-card ${styles.heroCard}`}>
        <span className={styles.heroIndex}>QICORE / PRODUCT 01</span>
        <form className={styles.heroBetaInvite} data-oyscat-beta-form>
          <label className={styles.inputLabel} htmlFor="hero-beta-email"><Bi zh="填写邮箱申请内测资格" en="Enter your email to apply for beta" /></label>
          <div className={styles.heroBetaFields}>
            <div className={styles.inputStage}>
              <input className={styles.heroBetaInput} id="hero-beta-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder=" " />
          <div className={styles.heroBetaTicker} aria-hidden="true">
            <div className={styles.heroBetaTickerTrack}>
              {[0, 1].map((group) => (
                <span className={styles.heroBetaTickerGroup} key={group}>
                  <span><Bi zh="填写邮箱申请内测资格" en="ENTER YOUR EMAIL TO APPLY FOR BETA" /></span>
                  <span className={styles.pixelCatPack}>
                    <PixelCat className={styles.pixelCat} />
                    <PixelCat className={styles.pixelCat} />
                    <PixelCat className={styles.pixelCat} />
                  </span>
                </span>
              ))}
            </div>
          </div>
            </div>
            <button className={styles.heroBetaButton} type="submit"><OyscatCompanion className={styles.buttonCat} /><Bi zh="申请" en="Apply" /></button>
          </div>
          <p className={styles.heroBetaStatus} data-beta-status role="status" aria-live="polite" hidden>
            <span data-lang="zh">感谢您的报名，我们将尽快与您联系。</span>
            <span data-lang="en">Thanks for signing up. We&apos;ll reach out to you soon.</span>
          </p>
        </form>
        <img className={styles.heroShell} src="/brand/oyscat-shell-derived.svg" alt="" />

        <span className={styles.heroSymbolFrame}>
          <img
            className={styles.heroSymbol}
            src="/brand/oyscat-workspace-loading-320-12fps.webp"
            alt=""
            decoding="async"
          />
        </span>
        <img className={styles.heroWordmark} src="/brand/oyscat-wordmark.png" alt="" />
        <span className={styles.heroNote}>IDEA · SIMULATION · REALITY</span>
      </div>
    </div>
  );
}

export default function OyscatPage() {
  return (
    <MarketingPage
      pageClassName={`oyscat-page ${styles.page}`}
      eyebrow={{ zh: "Oyscat / 气核产品 01", en: "Oyscat / QiCore Product 01" }}
      title={{ zh: "想造就造\n所想即所得", en: "Think it. Build it.\nGet exactly what you imagined." }}
      intro={{
        zh: "Oyscat 是气核推出的首款造物系统，让电气化造物变得更高效、更敏捷。",
        en: "Oyscat is a new creation system for the physical world. It makes electronics projects streamlined, efficient, and effortless.",
      }}
      heroVisual={<ProductHeroVisual />}
    >
      <section className={`marketing-section ${styles.principles}`} aria-labelledby="principles-title">
        <header data-qicore-waterfall="2">
          <p className="section-kicker">01 / WHY OYSCAT</p>
          <h2 id="principles-title"><Bi zh="让电气化造物更敏捷" en="A more agile way to create with electronics" /></h2>
        </header>
        <div className={styles.principleGrid}>
          {principles.map((principle, index) => (
            <article key={principle.index} data-qicore-waterfall={String(index + 3)}>
              <div className={styles.principleMeta}>
                <span>{principle.index}</span>
                <span>OY / 0{index + 1}</span>
              </div>
              <OyscatPixelScene kind={(["design", "modules", "creation"] as const)[index]} />
              <h3><Bi zh={principle.zh} en={principle.en} /></h3>
            </article>
          ))}
        </div>
      </section>

      <section className={`marketing-section ${styles.storyCard}`} id="system" aria-labelledby="workspace-title">
        <div className={styles.storyCopy} data-qicore-waterfall="3">
          <p className="section-kicker">02 / OYSCAT WORKSPACE</p>
          <OyscatPixelScene kind="workspace" compact />
          <h2 id="workspace-title"><Bi zh="Oyscat 造物工作台" en="Oyscat Workspace" /></h2>
          <p className={styles.storyLead}><Bi zh="直观的拖拽与积木式拼搭，赋予用户自由造物体验。" en="Intuitive drag-and-drop and block-based building let users create freely." /></p>
          <ul>
            <li><Bi zh="自动编写控制程序并实时仿真，实现组装前的全流程闭环验证。" en="AI generates control programs and runs real-time simulations, enabling full validation before physical assembly." /></li>
            <li><Bi zh="消除跨界工程门槛与高成本试错，加速想法直达实体。" en="Eliminate interdisciplinary engineering barriers and costly trial and error, taking ideas straight to reality." /></li>
          </ul>
          <a className={styles.textLink} href="#beta"><Bi zh="申请体验" en="Apply for access" /><span aria-hidden="true">↘</span></a>
        </div>
        <figure className={styles.storyMedia} data-qicore-waterfall="4">
          <div className={styles.mediaStage}>
            <video autoPlay muted loop playsInline preload="metadata" poster="/media/v3/workspace-poster.jpg" aria-label="Oyscat Workspace demo">
              <source src="/media/v3/workspace-demo.mp4" type="video/mp4" />
            </video>
            <div className={styles.mediaHud} aria-hidden="true">
              <span><i />LIVE</span>
              <span>SIM / 01</span>
              <span>LINKED</span>
            </div>
          </div>
          <figcaption><span>WORKSPACE / LIVE SIMULATION</span><span>01:1 DIGITAL MODEL</span></figcaption>
        </figure>
      </section>

      <section className={`marketing-section ${styles.storyCard} ${styles.hardwareCard}`} aria-labelledby="blocks-title">
        <figure className={styles.storyMedia} data-qicore-waterfall="3">
          <div className={`${styles.mediaStage} ${styles.hardwareStage}`}>
            <OyscatImage src="/media/oyscat-workspace/electronic-modules-dark-studio.png" zh="Oyscat 电子模块" en="Oyscat Electronic Blocks" large />
            <div className={styles.moduleLegend} aria-hidden="true">
              <span><i />INPUT</span>
              <span><i />MOTION</span>
              <span><i />LIGHT</span>
              <span><i />POWER</span>
            </div>
          </div>
          <figcaption><span>ELECTRONIC BLOCKS / FAMILY</span><span>PHYSICAL SYSTEM 02</span></figcaption>
        </figure>
        <div className={styles.storyCopy} data-qicore-waterfall="4">
          <p className="section-kicker">03 / ELECTRONIC BLOCKS</p>
          <OyscatPixelScene kind="connect" compact />
          <h2 id="blocks-title"><Bi zh="Oyscat 电子模块" en="Oyscat Electronic Blocks" /></h2>
          <p className={styles.storyLead}><Bi zh="丰富多样的去中心化电子模块，自由组合，即插即用。" en="A rich, diverse collection of decentralized electronic blocks, built for plug-and-play, freeform combination." /></p>
          <ul>
            <li><Bi zh="自研高效微内核，实现超低延时协同。" en="Our in-house microkernel enables ultra-low-latency coordination." /></li>
            <li><Bi zh="硬件模块随心擦写重构，让每一次拆解都成为下一次造物的起点。" en="Blocks are erasable and reconfigurable, turning every teardown into the start of the next creation." /></li>
          </ul>
        </div>
      </section>

      <section className={`marketing-section ${styles.process}`} aria-label="Oyscat creation process" data-qicore-waterfall="4">
        <div className={styles.processHeader}>
          <p className="section-kicker">04 / CREATION FLOW</p>
          <span aria-hidden="true"><i /> IDEA SIGNAL / RUNNING</span>
        </div>
        <div className={styles.processLine}>
          {[
            { zh: "构想", en: "THINK" },
            { zh: "设计", en: "DESIGN" },
            { zh: "仿真", en: "SIMULATE" },
            { zh: "搭建", en: "BUILD" },
            { zh: "实现", en: "MAKE IT REAL" },
          ].map((step, index) => (
            <span key={step.en}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <b aria-hidden="true" />
              <Bi zh={step.zh} en={step.en} />
            </span>
          ))}
        </div>
      </section>

      <section className={`marketing-section ${styles.cases}`} aria-labelledby="cases-title">
        <header data-qicore-waterfall="4">
          <p className="section-kicker">05 / FROM SCREEN TO REALITY</p>

          <h2 id="cases-title"><Bi zh="从屏幕到现实，轻松完成造物" en="From screen to reality. Create with ease." /></h2>
          <p><Bi zh="作品先在 Workspace 中完成设计与验证，再使用标准化电子模块走向真实世界。" en="Design and validate in Workspace, then bring the creation into the physical world with standardized electronic blocks." /></p>
        </header>
        <div className={styles.caseGrid}>
          <figure data-qicore-waterfall="5">
            <OyscatImage src="/media/oyscat-workspace/motion-study-main.webp" zh="双机械臂运动研究" en="Dual-arm motion study" showPrompt={false} />
            <figcaption><strong><Bi zh="双机械臂运动研究" en="Dual-arm motion study" /></strong><span>MOTION / 01</span></figcaption>
          </figure>
          <figure data-qicore-waterfall="5">
            <OyscatImage src="/media/oyscat-workspace/quadruped-study.png" zh="模块化机械狗" en="Modular quadruped" showPrompt={false} />
            <figcaption><strong><Bi zh="模块化机械狗" en="Modular quadruped" /></strong><span>GAIT / 02</span></figcaption>
          </figure>
          <figure data-qicore-waterfall="5">
            <OyscatImage src="/media/oyscat-workspace/voxel-rover-crop.webp" zh="模块化游戏控制台" en="Modular game console" showPrompt={false} />
            <figcaption><strong><Bi zh="模块化游戏控制台" en="Modular game console" /></strong><span>CONTROL / 03</span></figcaption>
          </figure>
        </div>
      </section>

      <section className={`marketing-section ${styles.faq}`} id="faq" aria-labelledby="faq-title">
        <header data-qicore-waterfall="5">
          <p className="section-kicker">06 / FAQ</p>
          <h2 id="faq-title"><Bi zh="你可能想知道" en="Good questions." /></h2>
          <p><Bi zh="以下能力描述以内测实际开放范围为准。" en="Feature availability depends on the current beta release." /></p>
        </header>
        <div className={styles.faqList} data-qicore-waterfall="6">
          {faqs.map((faq, index) => (
            <details key={faq.zh}>
              <summary>
                <span className={styles.faqIndex}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.faqQuestion}><Bi zh={faq.zh} en={faq.en} /></span>
                <i className={styles.faqToggle} aria-hidden="true">＋</i>
              </summary>
              <p><Bi zh={faq.answerZh} en={faq.answerEn} /></p>
            </details>
          ))}
        </div>
      </section>

      <ContentBeta />
    </MarketingPage>
  );
}
