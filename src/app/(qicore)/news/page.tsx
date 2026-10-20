import type { Metadata } from "next";
import { messages } from "@/i18n/messages";
import { createPageMetadata, seoCopy } from "@/configs/seo";
import { ArrowRight } from "lucide-react";
import { MarketingPage } from "@/components/marketing-page";
import { SectionHeading } from "@/components/section-heading";
import { BilingualText as Bi } from "@/components/bilingual-text";

export const metadata: Metadata = createPageMetadata({
  title: seoCopy.newsTitle.zh,
  description: seoCopy.newsDescription.zh,
  path: "/news",
  keywords: `${seoCopy.keywords.zh},Oyscat内测,气核科技新闻`
});

export default function NewsPage() {
  return (
    <MarketingPage
      pageClassName="news-page"
      eyebrow={messages.news.newsUpdates}
      title={messages.news.creationInMotion}
      intro={messages.news.followQicoreAsIntentDrivenPhysicalCreation}
      tone="light"
      backdrop="#f1f1ee"
    >
      <section className="news-journal bg-white" aria-labelledby="news-featured">
        <div className="site-container py-16 md:py-24">
          <SectionHeading
            eyebrow={messages.site.news.featured}
            title={messages.news.newsUpdates}
            titleId="news-featured"
            align="left"
            waterfall="2"
          />

          <details className="news-entry mt-10 border-t border-line" data-qicore-waterfall="3">
            <summary className="grid cursor-pointer list-none gap-8 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-12 md:py-12">
              <div className="overflow-hidden rounded-2xl bg-surface">
                {/* Local static assets do not need an image optimization server. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/media/web/news-beta.webp"
                  alt=""
                  width={1280}
                  height={720}
                  loading="eager"
                  decoding="async"
                  className="block aspect-[16/9] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>

              <div className="news-entry-summary md:self-center">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[13px] text-ink-3">
                  <span><Bi zh={messages.news.productUpdates.zh} en={messages.news.productUpdates.en} /></span>
                  <span aria-hidden="true">·</span>
                  <time dateTime="2026-08-16">
                    <span data-lang="zh">{messages.news.august162026.zh}</span>
                    <span data-lang="en">{messages.news.august162026.en}</span>
                  </time>
                </p>
                <h3 className="mt-4 text-title font-semibold tracking-tight text-ink">
                  <span data-lang="zh">{messages.news.qicoreOpensItsFirstClosedBeta.zh}</span>
                  <span data-lang="en">{messages.news.qicoreOpensItsFirstClosedBeta.en}</span>
                </h3>
                <p className="mt-4 max-w-xl text-lead text-ink-2">
                  <span data-lang="zh">{messages.news.twentyNineCreatorsAreNowBuildingTheir.zh}</span>
                  <span data-lang="en">{messages.news.twentyNineCreatorsAreNowBuildingTheir.en}</span>
                </p>
                <span className="news-entry-toggle mt-6 mx-auto flex w-fit items-center gap-2 text-[15px] font-medium text-ink md:mx-0 md:inline-flex">
                  <span className="news-entry-toggle-closed">
                    <span data-lang="zh">{messages.newsEntryInteraction.readStory.zh}</span>
                    <span data-lang="en">{messages.newsEntryInteraction.readStory.en}</span>
                  </span>
                  <span className="news-entry-toggle-open">
                    <span data-lang="zh">{messages.newsEntryInteraction.closeStory.zh}</span>
                    <span data-lang="en">{messages.newsEntryInteraction.closeStory.en}</span>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
            </summary>

            <div className="news-entry-body grid w-full gap-5 border-t border-line py-10 text-[16px] leading-[1.9] text-ink-2">
              <div data-lang="zh" className="grid gap-5">
                <p>{messages.news.qicoreAnnouncedThatOyscatHasOfficiallyEntered.zh}</p>
                <p>{messages.news.theProgramIncludes29BetaUsersFrom.zh}</p>
                <p>{messages.news.theClosedBetaOpensAccessToThe.zh}</p>
              </div>
              <div data-lang="en" className="grid gap-5">
                <p>{messages.news.qicoreAnnouncedThatOyscatHasOfficiallyEntered.en}</p>
                <p>{messages.news.theProgramIncludes29BetaUsersFrom.en}</p>
                <p>{messages.news.theClosedBetaOpensAccessToThe.en}</p>
              </div>
            </div>
          </details>

        </div>
      </section>

    </MarketingPage>
  );
}
