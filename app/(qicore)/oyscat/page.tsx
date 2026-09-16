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
    "zh": "如何开始使用 Oyscat？",
    "en": "How Can I Get Started with Oyscat?",
    "answerZh": [
      "几分钟即可上手：使用邮箱注册，浏览官方项目，完成新手教程，即可开始创作。",
      "相信直觉，跟随想象，自由构建。在 Oyscat 中的创作没有标准答案。"
    ],
    "answerEn": [
      "Start in minutes: Sign up with your email, explore the official projects, and complete the beginner tutorial. You’re ready to start creating.",
      "Just create: Trust your instincts, follow your imagination, and build freely. There is no single right way to create."
    ]
  },
  {
    "zh": "Oyscat 的独特之处？",
    "en": "What Makes Oyscat Different?",
    "answerZh": [
      "造物过程类似搭积木，不用学复杂操作，专注想法就行。",
      "从想法到实物一步到位：设计、制作全程打通，都在这一个系统里完成。"
    ],
    "answerEn": [
      "An intuitive way to build: Just like you would with building blocks, so you can focus on your ideas.",
      "End-to-end creation: From design to physical creation, Oyscat connects the entire process in one system."
    ]
  },
  {
    "zh": "Oyscat 电子模块如何连接虚拟与现实？",
    "en": "How do Oyscat Electronic Blocks connect the virtual and physical worlds?",
    "answerZh": [
      "工作台里的每一个虚拟电子模块，都有外观、功能完全一致的实体电子模块与之对应；",
      "为每个模块编写的控制程序，可直接下载到对应的实体电子模块，实现仿真动作和现实模块运行的完全同步。"
    ],
    "answerEn": [
      "Each electronic block in the Oyscat Workspace has a matching physical electronic block with the same appearance and function.",
      "The control program created for each virtual electronic block can be downloaded directly to its corresponding physical block, allowing it to work the same way in the real world as it does in simulation."
    ]
  },
  {
    "zh": "用 Oyscat 工作台完成的造物，如何落地实体制作？",
    "en": "How can I build my creation after designing it in Oyscat Workspace?",
    "answerZh": [
      "搭配 3D 打印：作品的静态结构可一键导出 3D 模型，打印得到的外壳能和电子模块直接拼装；",
      "多种自由造壳方式：可用瓦楞纸、木板、亚克力等材料手工制作外壳，适配不同创作条件。"
    ],
    "answerEn": [
      "Use 3D printing: Export the static parts directly as 3D-printable files. The printed shell can then fit directly with the Oyscat Electronic Blocks, just like building with blocks.",
      "Build your own shell:  Use corrugated cardboard, wood, acrylic, or whatever materials you have on hand."
    ]
  },
  {
    "zh": "Oyscat 解决了哪些痛点？",
    "en": "How does Oyscat help?",
    "answerZh": [
      "消除硬件选型、电路设计，同时控制程序交由 AI 完成，用户只需描述创意，专注设计作品功能。",
      "复杂电子项目开发周期长、试错成本高，Oyscat 在虚拟环境前置验证方案，仿真验证通过，硬件方案即可实物落地，缩短原型周期、减少物料损耗，实现 “想造就造”。"
    ],
    "answerEn": [
      "Skip the complexity: No hardware selection or circuit design. AI handles the control programs, so you can describe your idea and focus on what you want to create.",
      "Test before you build: Validate your design in a virtual environment before building it physically, reducing prototyping time and material waste."
    ]
  }
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
      <div className={`company-blueprint-card ${styles.heroCard}`} data-oyscat-landing-card>
        <span className={styles.heroIndex}>QICORE / PRODUCT 01</span>

        <img className={styles.heroShell} src="/brand/oyscat-shell-derived.svg" alt="" />

        <span className={styles.heroSymbolFrame} data-oyscat-landing-cat>
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
          <ul>
            <li><Bi zh="直观的拖拽与积木式拼搭，赋予用户自由造物体验。" en="Intuitive drag-and-drop and block-based building let users create freely." /></li>
            <li><Bi zh="自动编写控制程序并实时仿真，实现组装前的全流程闭环验证。" en="AI generates control programs and runs real-time simulations, enabling full validation before physical assembly." /></li>
            <li><Bi zh="消除跨界工程门槛与高成本试错，加速想法直达实体。" en="Eliminate interdisciplinary engineering barriers and costly trial and error, taking ideas straight to reality." /></li>
          </ul>
        </div>
        <figure className={styles.storyMedia} data-qicore-waterfall="4">
          <div className={styles.mediaStage}>
            <video data-workspace-demo muted loop playsInline preload="metadata" poster="/media/v3/workspace-poster.jpg" aria-label="Oyscat Workspace demo">
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
            <OyscatImage src="/media/oyscat-workspace/electronic-modules-dark-studio.png" zh="Oyscat 电子模块" en="Oyscat Electronic Blocks" large showPrompt={false} />
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
          <h2 id="blocks-title"><Bi zh="Oyscat 电子模块" en="Oyscat Electronic Blocks" /></h2>
          <ul>
            <li><Bi zh="丰富多样的去中心化电子模块，自由组合，即插即用" en="A rich, diverse collection of decentralized electronic blocks, built for plug-and-play, flexible combination." /></li>
            <li><Bi zh="自研高效微内核，实现超低延时协同" en="Our original R&D microkernel enables ultra-low-latency coordination." /></li>
            <li><Bi zh="硬件模块随心擦写重构，让每一次拆解都成为下一次造物的起点" en="Oyscat Electronic Blocks are fully erasable and reconfigurable, turning every disassembly into the starting point for your next creation." /></li>
          </ul>
        </div>
      </section>

      <section className={`marketing-section ${styles.cases}`} aria-labelledby="cases-title">
        <header data-qicore-waterfall="4">
          <p className="section-kicker">05 / FROM SCREEN TO REALITY</p>

          <h2 id="cases-title"><Bi zh="从屏幕到现实，轻松完成造物" en="From screen to reality. Create with ease." /></h2>
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
          <h2 id="faq-title"><Bi zh="常见问题" en="FAQ" /></h2>
        </header>
        <div className={styles.faqList} data-qicore-waterfall="6">
          {faqs.map((faq, index) => (
            <details key={faq.zh}>
              <summary>
                <span className={styles.faqIndex}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.faqQuestion}><Bi zh={faq.zh} en={faq.en} /></span>
                <i className={styles.faqToggle} aria-hidden="true">＋</i>
              </summary>
              <ul>{faq.answerZh.map((text, index) => <li key={text}><Bi zh={text} en={faq.answerEn[index]} /></li>)}</ul>
            </details>
          ))}
        </div>
      </section>

      <ContentBeta />
    </MarketingPage>
  );
}
