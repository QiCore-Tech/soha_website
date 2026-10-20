"use client";

import { messages } from "@/i18n/messages";

import { useRef } from "react";
import { BilingualText as Bi } from "@/components/marketing-page";
import { useLocale } from "@/hooks/use-locale";
import { usePerformanceTier } from "@/hooks/use-performance-tier";
import { useHomeScrollTrigger } from "../hooks/use-home-scroll-trigger";
import { HomeExplorerImage } from "./home-explorer-image";
import { homeHeading } from "../lib/home-typography";

const container = "mx-auto! w-full max-w-(--site-content-max) px-(--site-gutter)!";

export function HomeBrandSections() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();
  const { tier, reducedMotion } = usePerformanceTier();
  const mode = useHomeScrollTrigger(rootRef, { locale, tier, reducedMotion });

  return (
    <div ref={rootRef} data-home-story data-home-motion={mode} className="bg-[#ffffff] text-[#1d1d1f]">
      <section data-home-section="capabilities" aria-labelledby="home-intro-heading">
        <div data-home-chapter="introduction" data-home-intro-static aria-labelledby="home-intro-heading" className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden py-16!">
          <div data-home-intro-content className={`${container} grid items-center gap-8 md:gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16`}>
            <div className="order-1 min-w-0 lg:order-1">
              <div className="max-w-[27rem]">
                <div data-scroll-reveal className="mb-5! flex items-center gap-3 font-mono text-[10px] font-medium tracking-[0.22em] text-[#686860] md:text-xs">
                  <span aria-hidden="true" className="h-px w-8 bg-[#4f632b]" />
                  <span><span data-lang="zh">{messages.homeBrandSections.fromIdeaToObject.zh}</span><span data-lang="en">{messages.homeBrandSections.fromIdeaToObject.en}</span></span>
                </div>
                <h2 id="home-intro-heading" data-scroll-reveal data-reveal-delay="0.08" className={`${homeHeading} max-w-[13rem] md:max-w-[24rem] lg:max-w-none text-balance`}>
                  <span data-lang="zh" className="block lg:whitespace-nowrap">{messages.homeBrandSections.fromIdeaToSomethingReal.zh}</span>
                  <span data-lang="en" className="block">{messages.homeBrandSections.fromIdeaToSomethingReal.en}</span>
                </h2>
                <p data-scroll-reveal data-reveal-delay="0.16" className="mt-6! max-w-[20rem] text-sm leading-[1.8] text-[#686860] md:text-base"><Bi zh={messages.homeBrandSections.designStructureDefineMotionAndBringEvery.zh} en={messages.homeBrandSections.designStructureDefineMotionAndBringEvery.en} /></p>
                <p data-scroll-reveal data-reveal-delay="0.24" className="mt-8! font-mono text-[10px] tracking-[0.18em] text-[#686860]"><span data-lang="zh">{messages.homeBrandSections.designConnectCreate.zh}</span><span data-lang="en">{messages.homeBrandSections.designConnectCreate.en}</span></p>
              </div>
            </div>
            <div data-scroll-reveal data-reveal-delay="0.12" className="order-2 min-w-0 overflow-hidden lg:order-2">
              <HomeExplorerImage />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
