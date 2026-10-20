"use client";

import { messages, formatMessage } from "@/i18n/messages";

import { useCallback } from "react";
import type { Key } from "react";
import { LogoLoop, type LogoItem } from "./logo-loop";
import styles from "./oyscat-testimonials.module.css";

function Bi({ zh, en }: { zh: string; en: string }) {
  return (
    <>
      <span data-lang="zh">{zh}</span>
      <span data-lang="en">{en}</span>
    </>
  );
}

type Mark = "gear" | "camera" | "lamp" | "plug" | "rover" | "rocket";

type Review = {
  id: string;
  index: string;
  initials: string;
  accent: string;
  mark: Mark;
  name: { zh: string; en: string };
  role: { zh: string; en: string };
  quote: { zh: string; en: string };
  tags: { zh: string; en: string }[];
};

const reviews: Review[] = [
  {
    id: "lin",
    index: "01",
    initials: "LZ",
    accent: "#4f632b",
    mark: "gear",
    name: messages.oyscatTestimonials.linZhiyuan,
    role: messages.oyscatTestimonials.hardwareMaker,
    quote: messages.oyscatTestimonials.aPrototypeUsedToMeanSchematicsPart,
    tags: [
      messages.oyscatTestimonials.simulationFirst,
      messages.oyscatTestimonials.weekendPrototype,
    ],
  },
  {
    id: "sheng",
    index: "02",
    initials: "MS",
    accent: "#6c942c",
    mark: "lamp",
    name: messages.oyscatTestimonials.mayaSheng,
    role: messages.oyscatTestimonials.makerEducator,
    quote: messages.oyscatTestimonials.theBiggestChangeInClassIsThat,
    tags: [
      messages.oyscatTestimonials.noCodeStart,
      messages.oyscatTestimonials.classroomReady,
    ],
  },
  {
    id: "chen",
    index: "03",
    initials: "CM",
    accent: "#91a99a",
    mark: "rover",
    name: messages.oyscatTestimonials.chenMo,
    role: messages.oyscatTestimonials.roboticsHobbyist,
    quote: messages.oyscatTestimonials.theOneToOneMatchBetweenVirtual,
    tags: [
      messages.oyscatTestimonials.whatYouSeeRuns,
      messages.oyscatTestimonials.lowLatencyLink,
    ],
  },
  {
    id: "alvarez",
    index: "04",
    initials: "DA",
    accent: "#c9857c",
    mark: "camera",
    name: messages.oyscatTestimonials.diegoAlvarez,
    role: messages.oyscatTestimonials.productDesigner,
    quote: messages.oyscatTestimonials.whatINeedToValidateIsInteraction,
    tags: [
      messages.oyscatTestimonials.text3dPrintReady,
      messages.oyscatTestimonials.formValidation,
    ],
  },
  {
    id: "zhou",
    index: "05",
    initials: "ZY",
    accent: "#d8c47d",
    mark: "plug",
    name: messages.oyscatTestimonials.zhouYutong,
    role: messages.oyscatTestimonials.indieDeveloper,
    quote: messages.oyscatTestimonials.iterationSpeedIsTheWinIfIt,
    tags: [
      messages.oyscatTestimonials.fastIteration,
      messages.oyscatTestimonials.lessWaste,
    ],
  },
  {
    id: "sato",
    index: "06",
    initials: "KS",
    accent: "#9ba8b5",
    mark: "rocket",
    name: messages.oyscatTestimonials.kenSato,
    role: messages.oyscatTestimonials.makerspaceLead,
    quote: messages.oyscatTestimonials.theBlocksCanBeErasedAndRecombined,
    tags: [
      messages.oyscatTestimonials.reusableBlocks,
      messages.oyscatTestimonials.sustainableMaking,
    ],
  },
];

const MAKER_ICON_COUNT = 29;
const logos: LogoItem[] = Array.from({ length: MAKER_ICON_COUNT }, (_, index) => ({
  reviewId: reviews[index % reviews.length].id,
  makerIndex: index,
}));

function MakerMark({ kind, className }: { kind: Mark; className?: string }) {
  const ink = "#242820";
  const lime = "#b1f33e";
  return (
    <svg className={className} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {kind === "gear" && (
        <>
          <rect x="6" y="1" width="4" height="14" fill={ink} />
          <rect x="1" y="6" width="14" height="4" fill={ink} />
          <rect x="4" y="4" width="8" height="8" fill={ink} />
          <rect x="6" y="6" width="4" height="4" fill={lime} />
        </>
      )}
      {kind === "lamp" && (
        <>
          <rect x="4" y="2" width="8" height="5" fill={ink} />
          <rect x="6" y="7" width="4" height="4" fill={lime} />
          <rect x="7" y="11" width="2" height="3" fill={ink} />
          <rect x="5" y="14" width="6" height="1" fill={ink} />
        </>
      )}
      {kind === "rover" && (
        <>
          <rect x="2" y="6" width="12" height="5" fill={ink} />
          <rect x="1" y="11" width="4" height="4" fill={ink} />
          <rect x="11" y="11" width="4" height="4" fill={ink} />
          <rect x="5" y="8" width="2" height="2" fill={lime} />
          <rect x="9" y="8" width="2" height="2" fill={lime} />
          <rect x="12" y="2" width="1" height="4" fill={ink} />
          <rect x="11" y="1" width="3" height="2" fill={lime} />
        </>
      )}
      {kind === "camera" && (
        <>
          <rect x="2" y="5" width="12" height="8" fill={ink} />
          <rect x="5" y="3" width="5" height="2" fill={ink} />
          <rect x="6" y="7" width="4" height="4" fill={lime} />
          <rect x="3" y="6" width="2" height="2" fill={lime} />
        </>
      )}
      {kind === "plug" && (
        <>
          <rect x="3" y="5" width="10" height="7" fill={ink} />
          <rect x="4" y="3" width="2" height="2" fill={ink} />
          <rect x="10" y="3" width="2" height="2" fill={ink} />
          <rect x="6" y="7" width="4" height="3" fill={lime} />
        </>
      )}
      {kind === "rocket" && (
        <>
          <rect x="6" y="1" width="4" height="3" fill={ink} />
          <rect x="5" y="4" width="6" height="6" fill={ink} />
          <rect x="3" y="10" width="3" height="3" fill={ink} />
          <rect x="10" y="10" width="3" height="3" fill={ink} />
          <rect x="6" y="11" width="4" height="3" fill={lime} />
        </>
      )}
    </svg>
  );
}

export function OyscatTestimonials() {
  const renderMaker = useCallback((item: LogoItem, _key: Key, isPrimaryCopy: boolean) => {
    const review = reviews.find(candidate => candidate.id === item.reviewId);
    if (!review) return null;
    const labelZh = formatMessage(messages.runtime.reviewLabel, "zh", { name: review.name.zh, role: review.role.zh });
    const labelEn = formatMessage(messages.runtime.reviewLabel, "en", { name: review.name.en, role: review.role.en });

    return (
      <button
        type="button"
        className={styles.chipHit}
        data-review-trigger="true"
        data-review-id={review.id}
        data-selected="false"
        aria-pressed={false}
        aria-label={labelZh}
        data-aria-label-zh={labelZh}
        data-aria-label-en={labelEn}
        tabIndex={isPrimaryCopy ? undefined : -1}
        title={review.name.en}
        data-title-zh={review.name.zh}
        data-title-en={review.name.en}
      >
        <span className={styles.chip}>
          <MakerMark kind={review.mark} className={styles.chipMark} />
        </span>
      </button>
    );
  }, []);

  return (
    <section className={styles.section} id="makers" data-testimonials aria-labelledby="makers-title">
      <div className={styles.inner} data-qicore-waterfall="5">
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" className={styles.eyebrowRule} />
            <Bi zh={messages.oyscatTestimonials.text04LovedByMakers.zh} en={messages.oyscatTestimonials.text04LovedByMakers.en} />
          </p>
          <h2 id="makers-title" className={styles.title}>
            <Bi zh={messages.oyscatTestimonials.makersAreAlreadyBuildingWithOyscat.zh} en={messages.oyscatTestimonials.makersAreAlreadyBuildingWithOyscat.en} />
          </h2>
          <p className={styles.lead}>
            <Bi
              zh={messages.oyscatTestimonials.fromStudentsAndEducatorsToIndieDevelopers.zh}
              en={messages.oyscatTestimonials.fromStudentsAndEducatorsToIndieDevelopers.en}
            />
          </p>
        </header>
      </div>

      <div className={styles.loopBand} data-qicore-waterfall="5">
        <LogoLoop
          logos={logos}
          speed={54}
          direction="left"
          logoHeight={64}
          gap={0}
          repeat={false}
          pauseOnHover={true}
          renderItem={renderMaker}
          ariaLabel={messages.oyscatTestimonials.oyscatMakers}
        />
        <p className={styles.hint}>
          <i aria-hidden="true" />
          <Bi zh={messages.oyscatTestimonials.tapAnAvatarToReadTheirReview.zh} en={messages.oyscatTestimonials.tapAnAvatarToReadTheirReview.en} />
        </p>
      </div>

      <div className={styles.stageWrap}>
        <div className={styles.stage} data-qicore-waterfall="6">
          {reviews.map((review, index) => (
            <article
              key={review.id}
              className={styles.panel}
              data-review-panel={review.id}
              hidden={index !== 0}
            >
              <span className={styles.quoteMark} aria-hidden="true">
                “
              </span>
              <div className={styles.panelBody}>
                <div className={styles.panelMeta}>
                  <span>
                    <Bi zh={formatMessage(messages.runtime.makerIndex, "zh", { index: review.index, total: String(reviews.length).padStart(2, "0") })} en={formatMessage(messages.runtime.makerIndex, "en", { index: review.index, total: String(reviews.length).padStart(2, "0") })} />
                  </span>
                  <span
                    className={styles.rating}
                    role="img"
                    aria-label={messages.oyscatTestimonials.text5OutOf5Stars.zh}
                    data-aria-label-zh={messages.oyscatTestimonials.text5OutOf5Stars.zh}
                    data-aria-label-en={messages.oyscatTestimonials.text5OutOf5Stars.en}
                  >
                    ★★★★★
                  </span>
                </div>
                <blockquote className={styles.quote}>
                  <Bi zh={review.quote.zh} en={review.quote.en} />
                </blockquote>
                <div className={styles.tagRow}>
                  {review.tags.map((tag) => (
                    <span key={tag.zh} className={styles.tag}>
                      <Bi zh={tag.zh} en={tag.en} />
                    </span>
                  ))}
                </div>
                <footer className={styles.author}>
                  <span className={styles.avatar} style={{ background: review.accent }} aria-hidden="true">
                    {review.initials}
                  </span>
                  <span className={styles.authorText}>
                    <span className={styles.name}>
                      <Bi zh={review.name.zh} en={review.name.en} />
                    </span>
                    <span className={styles.role}>
                      <Bi zh={review.role.zh} en={review.role.en} />
                    </span>
                  </span>
                  <span className={styles.verified}>
                    ✓ <Bi zh={messages.oyscatTestimonials.betaBuilder.zh} en={messages.oyscatTestimonials.betaBuilder.en} />
                  </span>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
