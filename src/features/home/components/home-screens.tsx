"use client";

import { messages } from "@/i18n/messages";

import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import type { LocalizedText } from "@/types/locale";
import { isQiCoreRoute } from "@/lib/qicore-client-navigation";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import GradientWaves from "./gradient-waves";
import { HomeGenpiDiagram } from "./home-genpi-diagram";
import { HomePlaceholder } from "./home-placeholder";
import { homeDisplayHeading } from "../lib/home-typography";

const productSiteUrl = "https://beta-hk.oyscat.com/";

// Same workspace demo as the Oyscat page (#system).
const productVideo = { src: "/media/v3/workspace-demo.mp4", poster: "/media/v3/workspace-poster.jpg", label: messages.oyscat.oyscatWorkspaceDemo };

const productFeatures = [
  messages.homeScreens.productFeatureDesign,
  messages.homeScreens.productFeatureModules,
  messages.homeScreens.productFeatureElectrify,
];

const screen = "relative isolate flex min-h-svh w-full min-w-0 items-center overflow-hidden";
// The hero copy keeps its own fixed edge inset (plus a vw offset) over the full-bleed backdrop.
const heroGutter = "px-[max(1.5rem,env(safe-area-inset-left),env(safe-area-inset-right))]! md:px-[max(2.5rem,env(safe-area-inset-left),env(safe-area-inset-right))]! lg:px-[max(4rem,env(safe-area-inset-left),env(safe-area-inset-right))]!";
const container = "mx-auto! w-full max-w-(--site-content-max) px-(--site-gutter)!";
// Leaves room for the fixed site header above every screen.
const screenPadding = "pt-28! pb-20! [@media(max-height:500px)]:pt-20! [@media(max-height:500px)]:pb-12!";

function Bi({ text }: { text: LocalizedText }) {
  return <><span data-lang="zh">{text.zh}</span><span data-lang="en">{text.en}</span></>;
}

function Eyebrow({ text, reveal, dark }: { text: LocalizedText; reveal?: boolean; dark?: boolean }) {
  return (
    <p data-scroll-reveal={reveal ? "" : undefined} className={`mb-6! flex items-center gap-3 font-mono text-[10px] font-medium tracking-[0.25em] sm:text-xs [@media(max-height:500px)]:mb-3! ${dark ? "text-white/70" : "text-[#686860]"}`}>
      <span aria-hidden="true" className={`h-px w-8 shrink-0 ${dark ? "bg-[#FF98B4]" : "bg-[#4f632b]"}`} />
      <span><Bi text={text} /></span>
    </p>
  );
}

function scrollToNextScreen(event: MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById("home-genpi");
  if (!target) return;
  event.preventDefault();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

function HeroScreen() {
  return (
    <section id="home-hero" data-home-section="hero" aria-labelledby="home-hero-heading" className={`${screen} text-white`}>
      <div aria-hidden="true" className="absolute inset-0 bg-[#050705]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen"
      >
        <GradientWaves
          horizonColor="#8378F2"
          waveColor="#FF98B4"
          crestColor="#F6D991"
          backgroundColor="transparent"
          speed={0.3}
          amplitude={2.4}
          waveScale={0.52}
          waveRatio={0.82}
          swell={30}
          turbulence={16}
          tilt={66}
          zoom={1.05}
          height={5.4}
          fogDepth={18}
          relief={0.92}
          lightAngle={115}
          sheen={0.4}
          brightness={1.25}
          opacity={0.68}
          grain={0.1}
          quality="low"
          intro
          mouseInteraction
          parallaxStrength={0.28}
          mouseStrength={0.45}
          swellOnClick={false}
          dpr={1.4}
        />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] bg-linear-to-t from-black/75 via-black/10 to-transparent" />
      {/* Static so the text never flashes on load; lifted and inset so it does not hug the corner. */}
      <div className={`${heroGutter} relative z-10 w-full self-end pt-28! pb-24! md:pb-28! lg:pb-[max(8rem,14svh)]! [@media(max-height:500px)]:pt-20! [@media(max-height:500px)]:pb-12!`}>
        <div className="max-w-2xl md:ml-6! lg:ml-[max(2rem,3vw)]! [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
          <Eyebrow text={messages.homeScreens.heroEyebrow} dark />
          <h1 id="home-hero-heading" className={`${homeDisplayHeading} whitespace-pre-line`}>
            <Bi text={messages.homeScreens.heroTitle} />
          </h1>
          <p className="mt-6! max-w-md text-base leading-[1.8] text-white/75 sm:text-lg [@media(max-height:500px)]:mt-3! [@media(max-height:500px)]:text-sm">
            <Bi text={messages.homeScreens.heroSubtitle} />
          </p>
        </div>
      </div>
      <a href="#home-genpi" onClick={scrollToNextScreen} className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex min-h-11 min-w-11 -translate-x-1/2 flex-col items-center justify-center gap-1 px-3! font-mono text-[10px] tracking-[0.2em] text-white/70 no-underline! transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [@media(max-height:500px)]:hidden">
        <span><Bi text={messages.homeScreens.scrollHint} /></span>
        <ChevronDown size={18} aria-hidden="true" data-home-scroll-cue />
      </a>
    </section>
  );
}

function GenpiScreen() {
  return (
    <section id="home-genpi" data-home-section="genpi" aria-labelledby="home-genpi-heading" className={`${screen} bg-white text-[#151816]`}>
      {/* Short desktop windows (e.g. 1366×768) trim the padding so the diagram still fits. */}
      <div className={`${container} ${screenPadding} md:[@media(min-height:501px)_and_(max-height:800px)]:pt-24! md:[@media(min-height:501px)_and_(max-height:800px)]:pb-12!`}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(6rem,0.4fr)_minmax(0,1fr)] lg:items-end lg:gap-0">
          <div className="min-w-0 lg:col-start-1">
            <Eyebrow text={messages.homeScreens.genpiEyebrow} reveal />
            <h2 id="home-genpi-heading" data-scroll-reveal data-reveal-delay="0.08" className="font-heading text-[clamp(24px,2.7vw,40px)] leading-[1.15] font-semibold tracking-[-0.01em]">
              <span className="block whitespace-nowrap" data-lang="zh">{messages.homeScreens.genpiTitle.zh}</span>
              {/* The English title already ends in "(GenPI)". */}
              <span className="block" data-lang="en">{messages.homeScreens.genpiTitle.en}</span>
            </h2>
          </div>
          <p data-scroll-reveal data-reveal-delay="0.16" className="max-w-xl text-sm leading-[1.8] text-[#5c605a] sm:text-base lg:col-span-1 lg:col-start-3 lg:pb-2! lg:text-[clamp(12px,1.05vw,16px)] [@media(max-height:500px)]:text-sm">
            <span data-lang="zh" className="lg:whitespace-nowrap">{messages.homeScreens.genpiDescription.zh}</span>
            <span data-lang="en">{messages.homeScreens.genpiDescription.en}</span>
          </p>
        </div>
        <HomeGenpiDiagram className="mt-10! lg:mt-14! [@media(max-height:500px)]:mt-8!" />
      </div>
    </section>
  );
}

// The home screens sit outside the route shell's panels, so this video drives its
// own playback: muted loop while at least 30% visible and the tab is shown.
function ProductVideo() {
  const { locale } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden) {
        video.muted = true;
        void video.play().catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.3;
      sync();
    }, { threshold: [0, 0.3] });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, []);
  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="metadata"
      poster={productVideo.poster}
      aria-label={productVideo.label[locale]}
      data-aria-label-zh={productVideo.label.zh}
      data-aria-label-en={productVideo.label.en}
      className="block aspect-[16/9] w-full object-cover"
    >
      <source src={productVideo.src} type="video/mp4" />
    </video>
  );
}

function ProductScreen() {
  return (
    <section id="home-product" data-home-section="product" aria-labelledby="home-product-heading" className={`${screen} bg-[#f4f5f1] text-[#151816]`}>
      <div className={`${container} ${screenPadding}`}>
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="min-w-0">
            <Eyebrow text={messages.homeScreens.productEyebrow} reveal />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 lg:block">
              <h2 id="home-product-heading" data-scroll-reveal data-reveal-delay="0.08" className={`${homeDisplayHeading} col-start-1 row-start-1 min-h-11`}>
                <a href={productSiteUrl} target="_blank" rel="noopener noreferrer" className="text-inherit no-underline! transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#151816]">
                  <Bi text={messages.homeScreens.productTitle} />
                </a>
              </h2>
              <p data-scroll-reveal data-reveal-delay="0.16" className="col-span-2 row-start-2 mt-6! max-w-lg text-base leading-[1.8] text-[#5c605a] sm:text-lg [@media(max-height:500px)]:mt-3! [@media(max-height:500px)]:text-sm">
                <Bi text={messages.homeScreens.productDescription} />
              </p>
              <a data-scroll-reveal data-reveal-delay="0.24" href={productSiteUrl} target="_blank" rel="noopener noreferrer" className="group col-start-2 row-start-1 mt-0! inline-flex min-h-0 shrink-0 items-center self-stretch justify-self-end gap-4 rounded-full bg-[#151816] py-0! pr-2! pl-6! text-sm font-medium text-white! no-underline! transition-colors hover:bg-[#2a2f2b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#151816] lg:mt-8! lg:min-h-11 lg:py-2!">
                <span><Bi text={messages.homeScreens.enterProductPage} /></span>
                <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-white text-[#151816] transition-transform group-hover:rotate-45 motion-reduce:transition-none">
                  <ArrowUpRight size={18} />
                </span>
              </a>
            </div>
          </div>
          <div data-scroll-reveal data-reveal-delay="0.12" className="min-w-0">
            <div className="overflow-hidden rounded-[20px] bg-[#e6e7e2]">
              <ProductVideo />
            </div>
          </div>
        </div>
        <ul className="mt-10! grid gap-3 md:grid-cols-3 md:gap-4 lg:mt-14! [@media(max-height:500px)]:mt-6!">
          {productFeatures.map((text, index) => (
            <li key={text.en} data-scroll-reveal data-reveal-delay={String(0.08 * index)} className="flex min-w-0 items-baseline gap-3 rounded-[20px] border border-black/8 bg-white p-5! md:p-6!">
              <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-[#8a8e86]">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 text-[15px] leading-snug font-medium sm:text-base"><Bi text={text} /></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeScreens() {
  const pathname = usePathname();
  function navigate(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || url.search || url.hash || !isQiCoreRoute(url.pathname)) return;
    const request = new CustomEvent("qicore:navigate", { cancelable: true, detail: { href: url.pathname } });
    if (!window.dispatchEvent(request)) event.preventDefault();
  }

  return pathname === "/" ? (
    <main data-home-page onClick={navigate}>
      <HeroScreen />
      <GenpiScreen />
      <ProductScreen />
    </main>
  ) : null;
}
