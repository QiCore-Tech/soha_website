
import { messages } from "@/i18n/messages";
import { OyscatImage } from "@/features/oyscat/components/oyscat-image";
import { OyscatPixelScene } from "@/features/oyscat/components/oyscat-pixel-scenes";
import type { Metadata } from "next";
import { OyscatTestimonials } from "@/features/oyscat/components/oyscat-testimonials";
import { BilingualText as Bi, MarketingPage } from "@/components/marketing-page";
import styles from "./oyscat.module.css";

export const metadata: Metadata = {
  title: messages.oyscat.oyscat2.zh,
  description: messages.oyscat.oyscat3.zh,
};

// Shared rhythm with the homepage: roomy chapters, hairline rules, big type.
const container = "mx-auto! w-full max-w-(--site-content-max) px-(--site-gutter)!";
const chapter = "py-20! md:py-28! lg:py-36!";
const eyebrow = "mb-6! flex items-center gap-3 font-mono text-[10px] font-medium tracking-[0.22em] text-[#686860] md:text-xs";
const display = "font-heading text-[clamp(2.25rem,5.2vw,5rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-balance text-[#1d1d1f]";
const stageTitle = "font-heading text-[clamp(2rem,3.7vw,3.4rem)] leading-[1.14] font-semibold tracking-[-0.035em] text-balance text-[#1d1d1f]";
const lead = "mt-6! text-base leading-[1.75] text-[#686860] md:text-lg";

const principles = [
  {
    index: messages.oyscat.text01Design,
    zh: messages.oyscat.aiPoweredDesignAndSimulationSystemWith.zh,
    en: messages.oyscat.aiPoweredDesignAndSimulationSystemWith.en,
  },
  {
    index: messages.oyscat.text02Modules,
    zh: messages.oyscat.standardizedDecentralizedAndReusableElectronicBlocks.zh,
    en: messages.oyscat.standardizedDecentralizedAndReusableElectronicBlocks.en,
  },
  {
    index: messages.oyscat.text03Creation,
    zh: messages.oyscat.empoweringAnyoneToBuildElectronicCreationsFast.zh,
    en: messages.oyscat.empoweringAnyoneToBuildElectronicCreationsFast.en,
  },
];

const faqs = [
  {
    "zh": messages.oyscat.howCanIGetStartedWithOyscat.zh,
    "en": messages.oyscat.howCanIGetStartedWithOyscat.en,
    "answerZh": [
      messages.oyscat.startInMinutesSignUpWithYour.zh,
      messages.oyscat.justCreateTrustYourInstinctsFollowYour.zh
    ],
    "answerEn": [
      messages.oyscat.startInMinutesSignUpWithYour.en,
      messages.oyscat.justCreateTrustYourInstinctsFollowYour.en
    ]
  },
  {
    "zh": messages.oyscat.whatMakesOyscatDifferent.zh,
    "en": messages.oyscat.whatMakesOyscatDifferent.en,
    "answerZh": [
      messages.oyscat.anIntuitiveWayToBuildJustLike.zh,
      messages.oyscat.endToEndCreationFromDesignTo.zh
    ],
    "answerEn": [
      messages.oyscat.anIntuitiveWayToBuildJustLike.en,
      messages.oyscat.endToEndCreationFromDesignTo.en
    ]
  },
  {
    "zh": messages.oyscat.howDoOyscatElectronicBlocksConnectThe.zh,
    "en": messages.oyscat.howDoOyscatElectronicBlocksConnectThe.en,
    "answerZh": [
      messages.oyscat.eachElectronicBlockInTheOyscatWorkspace.zh,
      messages.oyscat.theControlProgramCreatedForEachVirtual.zh
    ],
    "answerEn": [
      messages.oyscat.eachElectronicBlockInTheOyscatWorkspace.en,
      messages.oyscat.theControlProgramCreatedForEachVirtual.en
    ]
  },
  {
    "zh": messages.oyscat.howCanIBuildMyCreationAfter.zh,
    "en": messages.oyscat.howCanIBuildMyCreationAfter.en,
    "answerZh": [
      messages.oyscat.use3dPrintingExportTheStaticParts.zh,
      messages.oyscat.buildYourOwnShellUseCorrugatedCardboard.zh
    ],
    "answerEn": [
      messages.oyscat.use3dPrintingExportTheStaticParts.en,
      messages.oyscat.buildYourOwnShellUseCorrugatedCardboard.en
    ]
  },
  {
    "zh": messages.oyscat.howDoesOyscatHelp.zh,
    "en": messages.oyscat.howDoesOyscatHelp.en,
    "answerZh": [
      messages.oyscat.skipTheComplexityNoHardwareSelectionOr.zh,
      messages.oyscat.testBeforeYouBuildValidateYourDesign.zh
    ],
    "answerEn": [
      messages.oyscat.skipTheComplexityNoHardwareSelectionOr.en,
      messages.oyscat.testBeforeYouBuildValidateYourDesign.en
    ]
  }
];

function ProductHeroVisual() {
  return (
    <div className={styles.heroArt} data-qicore-waterfall="1">
      <div className={styles.heroCard} data-oyscat-landing-card>
        <span className={styles.heroIndex}><span data-lang="zh">{messages.oyscat.qicoreProduct01.zh}</span><span data-lang="en">{messages.oyscat.qicoreProduct01.en}</span></span>

        <img className={styles.heroShell} src="/brand/oyscat-shell-derived.svg" alt="" />

        <span className={styles.heroSymbolFrame} data-oyscat-landing-cat>
          <img
            className={styles.heroSymbol}
            src="/brand/oyscat-workspace-loading-320-12fps.webp"
            alt=""
            decoding="async"
          />
        </span>
        <img className={styles.heroWordmark} src="/brand/oyscat-wordmark.png" alt={messages.oyscat.oyscat.zh} data-alt-zh={messages.oyscat.oyscat.zh} data-alt-en={messages.oyscat.oyscat.en} />
        <span className={styles.heroNote}><span data-lang="zh">{messages.oyscat.ideaSimulationReality.zh}</span><span data-lang="en">{messages.oyscat.ideaSimulationReality.en}</span></span>
      </div>
    </div>
  );
}

export default function OyscatPage() {
  return (
    <MarketingPage
      showHero={false}
      pageClassName={`oyscat-page ${styles.page}`}
      eyebrow={messages.oyscat.oyscatQicoreProduct01}
      title={messages.oyscat.thinkItBuildItGetExactlyWhat}
      intro={messages.oyscat.oyscatIsANewCreationSystemFor}
    >
      <section className={`${styles.hero} overflow-hidden border-b border-black/10`} aria-labelledby="oyscat-hero-title">
        <div aria-hidden="true" className={styles.heroGrid} />
        <div className={`${container} relative grid items-center gap-12 pt-[clamp(7.5rem,16vh,11rem)]! pb-16! md:gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:pb-24!`}>
          <div data-qicore-waterfall="0" className="min-w-0">
            <p className={eyebrow}>
              <span aria-hidden="true" className="h-px w-8 bg-[#4f632b]" />
              <Bi zh={messages.oyscat.oyscatQicoreProduct01.zh} en={messages.oyscat.oyscatQicoreProduct01.en} />
            </p>
            <h1
              id="oyscat-hero-title"
              className="font-heading text-[clamp(2.6rem,5.6vw,5.6rem)] leading-[1.02] font-semibold tracking-[-0.05em] text-[#1d1d1f] text-balance"
            >
              <span data-lang="zh" className="block">{messages.oyscat.thinkItBuildIt.zh}<br />{messages.oyscat.getExactlyWhatYouImagined.zh}</span>
              <span data-lang="en" className="block">{messages.oyscat.thinkItBuildIt.en}<br />{messages.oyscat.getExactlyWhatYouImagined.en}</span>
            </h1>
            <p className={`${lead} max-w-[34rem]`}>
              <Bi
                zh={messages.oyscat.oyscatIsANewCreationSystemFor.zh}
                en={messages.oyscat.oyscatIsANewCreationSystemFor.en}
              />
            </p>
            <div className="mt-10! flex flex-wrap items-center gap-3">
              <a href="#system" className={styles.pillGhost}>
                <Bi zh={messages.oyscat.exploreTheWorkspace.zh} en={messages.oyscat.exploreTheWorkspace.en} />
              </a>
            </div>
            <dl className="mt-12! grid max-w-md grid-cols-2 gap-6 border-t border-black/10 pt-6! font-mono text-[9px] leading-relaxed tracking-[0.2em] text-[#686860]">
              <div>
                <dt className="text-[#4f632b]"><span data-lang="zh">{messages.oyscat.status.zh}</span><span data-lang="en">{messages.oyscat.status.en}</span></dt>
                <dd className="mt-2! tracking-[0.14em] text-[#1d1d1f]"><span data-lang="zh">{messages.oyscat.closedBeta.zh}</span><span data-lang="en">{messages.oyscat.closedBeta.en}</span></dd>
              </div>
              <div>
                <dt className="text-[#4f632b]"><span data-lang="zh">{messages.oyscat.model.zh}</span><span data-lang="en">{messages.oyscat.model.en}</span></dt>
                <dd className="mt-2! tracking-[0.14em] text-[#1d1d1f]"><span data-lang="zh">{messages.oyscat.text11Physical.zh}</span><span data-lang="en">{messages.oyscat.text11Physical.en}</span></dd>
              </div>
            </dl>
          </div>
          <ProductHeroVisual />
        </div>
      </section>

      <section className={`${styles.principles} border-t border-black/10`} aria-labelledby="principles-title">
        <div className={`${container} ${chapter}`}>
          <header data-qicore-waterfall="1" className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="max-w-[820px] lg:col-span-8">
              <p className={eyebrow}>
                <span aria-hidden="true" className="h-px w-8 bg-[#4f632b]" />
                <span data-lang="zh">{messages.oyscat.text01WhyOyscat.zh}</span><span data-lang="en">{messages.oyscat.text01WhyOyscat.en}</span></p>
              <h2 id="principles-title" className={display}>
                <Bi zh={messages.oyscat.aMoreAgileWayToCreateWith.zh} en={messages.oyscat.aMoreAgileWayToCreateWith.en} />
              </h2>
              <p className={`${lead} max-w-2xl`}>
                <Bi
                  zh={messages.oyscat.fromDesignAndSimulationToStandardizedBlocks.zh}
                  en={messages.oyscat.fromDesignAndSimulationToStandardizedBlocks.en}
                />
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-6 border-t border-black/10 pt-6! font-mono text-[9px] tracking-[0.2em] text-[#686860] lg:col-span-4 lg:border-t-0 lg:border-l lg:border-black/10 lg:pt-0! lg:pl-12!" aria-hidden="true">
              <div>
                <dt className="text-[#4f632b]"><span data-lang="zh">{messages.oyscat.system.zh}</span><span data-lang="en">{messages.oyscat.system.en}</span></dt>
                <dd className="mt-2! tracking-[0.14em] text-[#1d1d1f]"><span data-lang="zh">{messages.oyscat.oyscatCore.zh}</span><span data-lang="en">{messages.oyscat.oyscatCore.en}</span></dd>
              </div>
              <div>
                <dt className="text-[#4f632b]"><span data-lang="zh">{messages.oyscat.span.zh}</span><span data-lang="en">{messages.oyscat.span.en}</span></dt>
                <dd className="mt-2! tracking-[0.14em] text-[#1d1d1f]"><span data-lang="zh">{messages.oyscat.designBuild.zh}</span><span data-lang="en">{messages.oyscat.designBuild.en}</span></dd>
              </div>
            </dl>
          </header>
          <div className={styles.principleGrid}>
            {principles.map((principle, index) => (
              <article key={principle.index.en} data-qicore-waterfall={String(index + 2)} data-reveal-delay={index * 0.1}>
                <div className={styles.principleMeta}>
                  <span><span data-lang="zh">{principle.index.zh}</span><span data-lang="en">{principle.index.en}</span></span>
                  <span>{messages.oyscat.oy0.zh}{index + 1}</span>
                </div>
                <div className={styles.principleScene}>
                  <OyscatPixelScene kind={(["design", "modules", "creation"] as const)[index]} />
                </div>
                <h3><Bi zh={principle.zh} en={principle.en} /></h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.storyCard} id="system" aria-labelledby="workspace-title">
        <div className={`${container} grid items-center gap-12 border-t border-black/10 py-20! md:py-28! lg:grid-cols-[.92fr_1.08fr] lg:gap-20 lg:py-32!`}>
          <div className={styles.storyCopy} data-qicore-waterfall="3">
            <p className={eyebrow}>
              <span aria-hidden="true" className="h-px w-8 bg-[#4f632b]" />
              <span data-lang="zh">{messages.oyscat.text02OyscatWorkspace.zh}</span><span data-lang="en">{messages.oyscat.text02OyscatWorkspace.en}</span></p>
            <h2 id="workspace-title" className={stageTitle}>
              <Bi zh={messages.oyscat.oyscatWorkspace.zh} en={messages.oyscat.oyscatWorkspace.en} />
            </h2>
            <ul>
              <li><Bi zh={messages.oyscat.intuitiveDragAndDropAndBlockBased.zh} en={messages.oyscat.intuitiveDragAndDropAndBlockBased.en} /></li>
              <li><Bi zh={messages.oyscat.aiGeneratesControlProgramsAndRunsReal.zh} en={messages.oyscat.aiGeneratesControlProgramsAndRunsReal.en} /></li>
              <li><Bi zh={messages.oyscat.eliminateInterdisciplinaryEngineeringBarriersAndCostlyTrial.zh} en={messages.oyscat.eliminateInterdisciplinaryEngineeringBarriersAndCostlyTrial.en} /></li>
            </ul>
          </div>
          <figure className={styles.storyMedia} data-qicore-waterfall="4">
            <div className={styles.mediaStage}>
              <video data-workspace-demo muted loop playsInline preload="metadata" poster="/media/v3/workspace-poster.jpg" aria-label={messages.oyscat.oyscatWorkspaceDemo.zh} data-aria-label-zh={messages.oyscat.oyscatWorkspaceDemo.zh} data-aria-label-en={messages.oyscat.oyscatWorkspaceDemo.en}>
                <source src="/media/v3/workspace-demo.mp4" type="video/mp4" />
              </video>
              <div className={styles.mediaHud} aria-hidden="true">
                <span><i /><span data-lang="zh">{messages.oyscat.live.zh}</span><span data-lang="en">{messages.oyscat.live.en}</span></span>
                <span><span data-lang="zh">{messages.oyscat.sim01.zh}</span><span data-lang="en">{messages.oyscat.sim01.en}</span></span>
                <span><span data-lang="zh">{messages.oyscat.linked.zh}</span><span data-lang="en">{messages.oyscat.linked.en}</span></span>
              </div>
            </div>
            <figcaption className={styles.mediaCaption}><span><span data-lang="zh">{messages.oyscat.workspaceLiveSimulation.zh}</span><span data-lang="en">{messages.oyscat.workspaceLiveSimulation.en}</span></span><span><span data-lang="zh">{messages.oyscat.text011DigitalModel.zh}</span><span data-lang="en">{messages.oyscat.text011DigitalModel.en}</span></span></figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.storyCard} aria-labelledby="blocks-title">
        <div className={`${container} grid items-center gap-12 border-t border-black/10 py-20! md:py-28! lg:grid-cols-[1.08fr_.92fr] lg:gap-20 lg:py-32!`}>
          <div className={`${styles.storyCopy} lg:order-2`} data-qicore-waterfall="4">
            <p className={eyebrow}>
              <span aria-hidden="true" className="h-px w-8 bg-[#4f632b]" />
              <span data-lang="zh">{messages.oyscat.text03ElectronicBlocks.zh}</span><span data-lang="en">{messages.oyscat.text03ElectronicBlocks.en}</span></p>
            <h2 id="blocks-title" className={stageTitle}>
              <Bi zh={messages.oyscat.oyscatElectronicBlocks.zh} en={messages.oyscat.oyscatElectronicBlocks.en} />
            </h2>
            <ul>
              <li><Bi zh={messages.oyscat.aRichDiverseCollectionOfDecentralizedElectronic.zh} en={messages.oyscat.aRichDiverseCollectionOfDecentralizedElectronic.en} /></li>
              <li><Bi zh={messages.oyscat.ourOriginalRDMicrokernelEnablesUltra.zh} en={messages.oyscat.ourOriginalRDMicrokernelEnablesUltra.en} /></li>
              <li><Bi zh={messages.oyscat.oyscatElectronicBlocksAreFullyErasableAnd.zh} en={messages.oyscat.oyscatElectronicBlocksAreFullyErasableAnd.en} /></li>
            </ul>
          </div>
          <figure className={`${styles.storyMedia} lg:order-1`} data-qicore-waterfall="3">
            <div className={`${styles.mediaStage} ${styles.hardwareStage}`}>
              <OyscatImage src="/media/oyscat-workspace/electronic-modules-dark-studio.png" zh={messages.oyscat.oyscatElectronicBlocks.zh} en={messages.oyscat.oyscatElectronicBlocks.en} large />
              <div className={styles.moduleLegend} aria-hidden="true">
                <span><i /><span data-lang="zh">{messages.oyscat.input.zh}</span><span data-lang="en">{messages.oyscat.input.en}</span></span>
                <span><i /><span data-lang="zh">{messages.oyscat.motion.zh}</span><span data-lang="en">{messages.oyscat.motion.en}</span></span>
                <span><i /><span data-lang="zh">{messages.oyscat.light.zh}</span><span data-lang="en">{messages.oyscat.light.en}</span></span>
                <span><i /><span data-lang="zh">{messages.oyscat.power.zh}</span><span data-lang="en">{messages.oyscat.power.en}</span></span>
              </div>
            </div>
            <figcaption className={styles.mediaCaption}><span><span data-lang="zh">{messages.oyscat.electronicBlocksFamily.zh}</span><span data-lang="en">{messages.oyscat.electronicBlocksFamily.en}</span></span><span><span data-lang="zh">{messages.oyscat.physicalSystem02.zh}</span><span data-lang="en">{messages.oyscat.physicalSystem02.en}</span></span></figcaption>
          </figure>
        </div>
      </section>

      <OyscatTestimonials />

      <section className={`${styles.faq} border-t border-black/10`} id="faq" aria-labelledby="faq-title">
        <div className={`${container} ${chapter}`}>
          <header data-qicore-waterfall="7" className="max-w-[820px]">
            <p className={eyebrow}>
              <span aria-hidden="true" className="h-px w-8 bg-[#4f632b]" />
              <span data-lang="zh">{messages.oyscat.text06Faq.zh}</span><span data-lang="en">{messages.oyscat.text06Faq.en}</span></p>
            <h2 id="faq-title" className={display}>
              <Bi zh={messages.oyscat.faq.zh} en={messages.oyscat.faq.en} />
            </h2>
          </header>
          <div className={styles.faqList} data-qicore-waterfall="8">
            {faqs.map((faq, index) => (
              <details key={faq.zh}>
                <summary>
                  <span className={styles.faqIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.faqQuestion}><Bi zh={faq.zh} en={faq.en} /></span>
                  <i className={styles.faqToggle} aria-hidden="true">＋</i>
                </summary>
                <ul>{faq.answerZh.map((text, answerIndex) => <li key={text}><Bi zh={text} en={faq.answerEn[answerIndex]} /></li>)}</ul>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
