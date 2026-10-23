"use client";

import { messages, formatMessage } from "@/i18n/messages";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { HomeBrandSections } from "./home-brand-sections";
import { isQiCoreRoute } from "@/lib/qicore-client-navigation";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useLocale } from "@/hooks/use-locale";
import { useHomeCarouselImageMotion } from "../hooks/use-home-carousel-image-motion";
import { homeHeading } from "../lib/home-typography";
import "swiper/css";
import "swiper/css/a11y";

// Replace these local images and captions to update the homepage banners.
const slides = [
  {
    image: "/media/banner/web/轮播图1-web版本.png",
    tabletImage: "/media/banner/ipad/轮播图1-ipad2版本.png",
    smallImage: "/media/banner/ipone/轮播图1-ipone版本.png",
    alt: messages.homeCarousel.oyscatSmartHardware,
    category: messages.homeCarousel.categoryCreation,
    title: messages.homeCarousel.thinkItMakeIt,
    description: messages.homeCarousel.fromAnIdeaToSomethingRealPut,
    features: [],
    link: "https://www.oyscat.com/",
    action: messages.homeCarousel.exploreOyscat
  },
  {
    image: "/media/banner/web/轮播图3-web版本.png",
    tabletImage: "/media/banner/ipad/轮播图3-ipad版本.png",
    smallImage: "/media/banner/ipone/轮播图3-ipone版本.png",
    alt: messages.homeCarousel.aCreativePixelWorkshop,
    category: messages.homeCarousel.categoryTogether,
    title: messages.homeCarousel.createWhatSNext,
    description: messages.homeCarousel.joinCuriousMakersAndBringNewPossibilities,
    features: [
      messages.homeCarousel.aiDesignAndSimulation,
      messages.homeCarousel.reusableElectronicModules,
      messages.homeCarousel.agileElectrifiedCreation,
    ],
    link: "https://www.oyscat.com/",
    action: messages.homeCarousel.exploreOyscat
  }
];

function Carousel() {
  const { locale } = useLocale();
  const rootRef = useRef<HTMLElement>(null);
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!swiper || swiper.destroyed) return;
    swiper.el.dataset.ariaRoledescriptionZh = messages.runtime.carousel.zh;
    swiper.el.dataset.ariaRoledescriptionEn = messages.runtime.carousel.en;
    swiper.el.setAttribute("aria-roledescription", messages.runtime.carousel[locale]);
    swiper.slides.forEach((slide, position) => {
      const index = Number(slide.dataset.swiperSlideIndex ?? position) + 1;
      for (const language of ["zh", "en"] as const) {
        slide.setAttribute(`data-aria-label-${language}`, formatMessage(messages.runtime.slideDescription, language, { index, total: slides.length }));
        slide.setAttribute(`data-aria-roledescription-${language}`, messages.runtime.slideRole[language]);
      }
      slide.setAttribute("aria-label", formatMessage(messages.runtime.slideDescription, locale, { index, total: slides.length }));
      slide.setAttribute("aria-roledescription", messages.runtime.slideRole[locale]);
    });
  }, [swiper, locale, activeIndex]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  const [reducedMotion, setReducedMotion] = useState(true);
  useHomeCarouselImageMotion(rootRef, activeIndex, reducedMotion, Boolean(swiper));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!swiper || swiper.destroyed) return;
    const sync = () => {
      if (swiper.destroyed) return;
      if (focused || reducedMotion || !inView || document.hidden) swiper.autoplay.stop();
      else swiper.autoplay.start();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [swiper, focused, reducedMotion, inView]);

  useEffect(() => {
    if (reducedMotion || !inView) return;
    let cancelled = false;
    let context: ReturnType<typeof import("gsap")["gsap"]["context"]> | undefined;
    void import("gsap").then(({ gsap }) => {
      if (cancelled || !rootRef.current) return;
      context = gsap.context(() => {
        const copy = rootRef.current?.querySelector(".swiper-slide-active [data-carousel-copy]");
        if (copy) gsap.fromTo(copy.children, { opacity: 0, y: 12 }, {
          opacity: 1, y: 0, duration: 0.45, stagger: 0.06, clearProps: "opacity,transform",
        });
      }, rootRef.current);
    }).catch(() => { /* 动画加载失败时保留可见的静态文案。 */ });
    return () => { cancelled = true; context?.revert(); };
  }, [activeIndex, reducedMotion, swiper, inView]);


  return (
    <section
      ref={rootRef}
      data-home-carousel
      data-active-slide={activeIndex}
      className="relative isolate h-screen w-full min-w-0 overflow-hidden bg-[#111315] text-white supports-[height:100dvh]:h-dvh [&_button]:cursor-pointer [&_a]:cursor-pointer"
      aria-label={messages.homeCarousel.featuredStories.zh} data-aria-label-zh={messages.homeCarousel.featuredStories.zh} data-aria-label-en={messages.homeCarousel.featuredStories.en}
      aria-roledescription={messages.runtime.carousel[locale]}
      data-aria-roledescription-zh={messages.runtime.carousel.zh}
      data-aria-roledescription-en={messages.runtime.carousel.en}
      onFocusCapture={(event) => setFocused(event.target.matches(":focus-visible"))}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <Swiper
        modules={[Autoplay, Keyboard, A11y]}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        slidesPerView={1}
        loop
        speed={reducedMotion ? 0 : 700}
        autoplay={{ enabled: false, delay: 5000, disableOnInteraction: false }}
        keyboard={{ enabled: true, onlyInViewport: true, pageUpDown: false }}
        a11y={{
          slideLabelMessage: messages.runtime.swiperSlide[locale],
          prevSlideMessage: messages.runtime.swiperPrevious[locale],
          nextSlideMessage: messages.runtime.swiperNext[locale],
          firstSlideMessage: messages.runtime.swiperFirst[locale],
          lastSlideMessage: messages.runtime.swiperLast[locale],
          paginationBulletMessage: messages.runtime.swiperBullet[locale],
          containerRoleDescriptionMessage: messages.runtime.carousel[locale],
          itemRoleDescriptionMessage: messages.runtime.slideRole[locale],
        }}
        onSwiper={setSwiper}
        onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.image}>
            <article className="relative flex h-full w-full items-end" aria-hidden={index !== activeIndex} inert={index !== activeIndex}>
              <picture className="absolute inset-0 block h-full w-full">
                <source media="(width < 768px)" srcSet={slide.smallImage} />
                <source media="(width < 1280px)" srcSet={slide.tabletImage} />
                {/* Local static assets do not need an image optimization server. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt={slide.alt[locale]} draggable={false} data-alt-zh={slide.alt.zh} data-alt-en={slide.alt.en} fetchPriority={index === 0 ? "high" : "auto"} loading={index === 0 ? "eager" : "lazy"} data-home-carousel-image className="home-carousel-image absolute inset-0 h-full w-full object-cover object-center" />
              </picture>
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/25 to-black/15" />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/40 to-transparent" />
              <div className="relative z-10 max-h-[calc(100dvh-5rem)] w-full overflow-y-auto">
              <div data-carousel-copy className="w-full pl-[max(1.5rem,env(safe-area-inset-left))]! pr-[max(1.5rem,env(safe-area-inset-right))]! pt-24! pb-[max(6rem,calc(4rem+env(safe-area-inset-bottom)))]! md:px-20! md:pb-28! lg:px-28! lg:pb-32! [@media(max-height:500px)]:px-20! [@media(max-height:500px)]:pt-20! [@media(max-height:500px)]:pb-16!">
                <p className="mb-5! font-mono text-[10px] font-medium tracking-[0.25em] text-white/70 sm:text-xs [@media(max-height:500px)]:mb-2!"><span data-lang="zh">{slide.category.zh}</span><span data-lang="en">{slide.category.en}</span></p>
                <h1 className={`${homeHeading} max-w-4xl text-balance`}>
                  <span data-lang="zh">{slide.title.zh}</span><span data-lang="en">{slide.title.en}</span>
                </h1>
                <p className="mt-5! max-w-xl text-sm leading-relaxed text-white/75 sm:text-lg [@media(max-height:500px)]:mt-2! [@media(max-height:500px)]:text-sm">
                  <span data-lang="zh">{slide.description.zh}</span><span data-lang="en">{slide.description.en}</span>
                </p>
                {slide.features.length > 0 && (
                  <ul className="mt-4! max-w-xl list-disc space-y-2 pl-5! text-sm leading-relaxed text-white/85 sm:text-base [@media(max-height:500px)]:mt-2!">
                    {slide.features.map((feature) => (
                      <li key={feature.en}>
                        <span data-lang="zh">{feature.zh}</span><span data-lang="en">{feature.en}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <a href={slide.link} tabIndex={index === activeIndex ? 0 : -1} className="mt-7! inline-flex min-h-11 items-center gap-6 rounded-full border border-white/40 bg-white/10 px-6! py-3! text-sm font-medium text-white! no-underline! backdrop-blur-md transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [@media(max-height:500px)]:mt-3!">
                  <span data-lang="zh">{slide.action.zh}</span><span data-lang="en">{slide.action.en}</span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </div>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      <div data-carousel-pagination className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-center" aria-label={messages.homeCarousel.chooseSlide.zh} data-aria-label-zh={messages.homeCarousel.chooseSlide.zh} data-aria-label-en={messages.homeCarousel.chooseSlide.en}>
          {slides.map((slide, index) => (
            <button key={slide.image} type="button" aria-label={formatMessage(messages.runtime.slideLabel, locale, { index: index + 1 })} data-aria-label-zh={formatMessage(messages.runtime.slideLabel, "zh", { index: index + 1 })} data-aria-label-en={formatMessage(messages.runtime.slideLabel, "en", { index: index + 1 })} aria-current={activeIndex === index ? "true" : undefined} onClick={() => swiper?.slideToLoop(index)} className="group flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-white">
              <span className={`block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${activeIndex === index ? "w-8 bg-white" : "w-2 bg-white/40 group-hover:bg-white/80"}`} />
            </button>
          ))}
      </div>
    </section>
  );
}

export function HomeCarousel() {
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
      <Carousel />
      <HomeBrandSections />
    </main>
  ) : null;
}
