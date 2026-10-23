"use client";

import { messages } from "@/i18n/messages";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BilingualText as Bi } from "@/components/marketing-page";
import { useLocale } from "@/hooks/use-locale";
import { useHomeLaptopScroll } from "../hooks/use-home-laptop-scroll";
import { HomeWorkspaceVideo } from "./home-workspace-video";
import { homeHeading } from "../lib/home-typography";
import styles from "./home-laptop-workspace.module.css";

export function HomeLaptopWorkspace() {
  const stageRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();
  const { scene, animated, complete, playbackEnabled, autoplayAllowed, onReady, onFailure } = useHomeLaptopScroll(stageRef, screenRef);
  const Scene = scene?.Component;
  useEffect(() => {
    window.dispatchEvent(new Event("qicore:laptop-refresh"));
  }, [animated, locale]);

  return <div data-home-chapter="workspace" className={`${styles.workspace} relative w-full`}>
    {/* ScrollTrigger pins this wrapper; the stage inside it is what rises, so the
        pin's own transform bookkeeping never fights the cover tween. */}
    <div data-home-laptop-pin>
      <div ref={stageRef} data-home-laptop-stage data-laptop-mode={animated ? "animated" : "static"} className={styles.stage}>
        {Scene && scene && <div data-laptop-canvas aria-hidden="true" className={styles.canvas}>
          <Scene key={scene.device} model={scene.model} device={scene.device} stageRef={stageRef} screenRef={screenRef} hintRef={hintRef} onReady={onReady} onFailure={onFailure} />
        </div>}
        {animated && <div data-laptop-introduction aria-hidden="true" className={`${styles.introduction} text-center`} style={{ opacity: complete ? 0 : undefined }}>
          <p className="mb-3! font-mono text-[10px] tracking-[0.22em] text-[#686860]"><span data-lang="zh">{messages.homeLaptopWorkspace.text02OyscatWorkspace.zh}</span><span data-lang="en">{messages.homeLaptopWorkspace.text02OyscatWorkspace.en}</span></p>
          <p className={homeHeading}><Bi zh={messages.homeLaptopWorkspace.bringYourIdeasToLife.zh} en={messages.homeLaptopWorkspace.bringYourIdeasToLife.en} /></p>
        </div>}
        <div ref={screenRef} data-home-laptop-screen className={styles.screen}>
          <HomeWorkspaceVideo presentation="screen" autoplayAllowed={autoplayAllowed} playbackEnabled={playbackEnabled} />
        </div>
        {animated && <div ref={hintRef} data-laptop-hint className={`${styles.hint} flex flex-col items-center gap-3 text-[#686860]`} aria-hidden="true">
          <span className="text-[10px] tracking-[0.2em]"><Bi zh={messages.homeLaptopWorkspace.scrollToOpen.zh} en={messages.homeLaptopWorkspace.scrollToOpen.en} /></span><ArrowDown className="size-4" />
        </div>}
      </div>
    </div>
    <div data-home-workspace-copy aria-labelledby="home-workspace" className="overflow-x-clip border-b border-black/8 bg-[#ffffff] px-[max(1.5rem,env(safe-area-inset-left),env(safe-area-inset-right))]! py-20! md:px-10! md:py-28! lg:px-16!">
      <div className="mx-auto! grid w-full max-w-[1280px] gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="mb-5! font-mono text-[10px] tracking-[0.22em] text-[#686860]"><span data-lang="zh">{messages.homeLaptopWorkspace.text02OyscatWorkspace.zh}</span><span data-lang="en">{messages.homeLaptopWorkspace.text02OyscatWorkspace.en}</span></p>
          <h2 id="home-workspace" className={`${homeHeading} text-balance`}><Bi zh={messages.homeLaptopWorkspace.designSimulateThenBuild.zh} en={messages.homeLaptopWorkspace.designSimulateThenBuild.en} /></h2>
        </div>
        <div>
          <p className="max-w-xl text-base leading-[1.75] text-[#686860] md:text-lg"><Bi zh={messages.homeLaptopWorkspace.bringStructureControlAndSimulationIntoOne.zh} en={messages.homeLaptopWorkspace.bringStructureControlAndSimulationIntoOne.en} /></p>
          <p className="mt-6! text-xs tracking-[0.08em] text-[#686860]"><Bi zh={messages.homeLaptopWorkspace.shapeDefineTest.zh} en={messages.homeLaptopWorkspace.shapeDefineTest.en} /></p>
          <Button nativeButton={false} render={<a href="https://www.oyscat.com/" target="_blank" rel="noopener noreferrer" />} variant="outline"
            className="mt-8! min-h-11 h-auto! max-w-full gap-3 rounded-full! border-black/20! bg-transparent! px-5! py-3! text-sm whitespace-normal text-[#1d1d1f]! no-underline! hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4">
            <Bi zh={messages.homeLaptopWorkspace.exploreOyscatWorkspace.zh} en={messages.homeLaptopWorkspace.exploreOyscatWorkspace.en} /><ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  </div>;
}
