"use client";

import { messages } from "@/i18n/messages";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { isQiCoreRoute, loadQiCoreRouteHtml, preloadQiCoreRouteHtml } from "@/lib/qicore-client-navigation";

import { useLocale } from "@/hooks/use-locale";
import { localeLabels } from "@/i18n/config";
import { pageTitles } from "@/i18n/messages";

const navItems = [
  { href: "/", zh: messages.marketingNav.home.zh, en: messages.marketingNav.home.en },
  { href: "/news", zh: messages.marketingNav.news.zh, en: messages.marketingNav.news.en },
  { href: "/about", zh: messages.marketingNav.aboutUs.zh, en: messages.marketingNav.aboutUs.en },
  { href: "/careers", zh: messages.marketingNav.joinUs.zh, en: messages.marketingNav.joinUs.en }
];



export function MarketingNav() {
  const pathname = usePathname();
  const navigationTimerRef = useRef<number | null>(null);
  const { locale, toggleLocale } = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isHomeScrolled, setIsHomeScrolled] = useState(false);

  useEffect(() => {
    const sync = () => setIsHomeScrolled(pathname === "/" && window.scrollY > 24);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [pathname]);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsReady(true);
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuToggleRef.current?.getAttribute("aria-expanded") === "true") {
        setIsMenuOpen(false);
        menuToggleRef.current.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);



  useEffect(() => {
    setIsMenuOpen(false);
    document.body.classList.remove(
      "is-qicore-navigating",
      "is-qicore-leaving-home",
      "is-qicore-switching-content",
      "is-qicore-client-navigation",
      "is-qicore-preparing-home-route",
      "is-qicore-nav-lifting"
    );
  }, [pathname]);

  useEffect(() => () => {
    if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current);
  }, []);

  useEffect(() => {
    void preloadQiCoreRouteHtml();
  }, []);

  useEffect(() => {
    const title = pageTitles[pathname];
    if (!title) return;
    const localizedTitle = title[locale];
    const applyLocalizedTitle = () => {
      if (document.title !== localizedTitle) document.title = localizedTitle;
    };

    applyLocalizedTitle();
    const observer = new MutationObserver(applyLocalizedTitle);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale, pathname]);


  function navigateToDocument(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || event.currentTarget.target === "_blank"
    ) return;

    setIsMenuOpen(false);
    if (href === pathname) {
      event.preventDefault();
      return;
    }
    // HTML snapshot navigation requires the persistent shell on both routes.
    // Independent pages (careers, style lab, 404) use native document navigation.
    if (!isQiCoreRoute(pathname) || !isQiCoreRoute(href)) return;
    if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current);
    const routeHtmlPromise = href !== "/"
      ? loadQiCoreRouteHtml(href)
      : Promise.resolve(null);
    event.preventDefault();
    document.body.classList.add("is-qicore-client-navigation");

    const commitNavigation = async () => {
      try {
        await routeHtmlPromise;
        window.sessionStorage.removeItem("qicore-route-entry");
        window.history.pushState(null, "", href);
      } catch {
        window.location.assign(href);
      }
    };

    navigationTimerRef.current = window.setTimeout(commitNavigation, 32);
  }

    return (
      <header data-home-scrolled={isHomeScrolled || undefined} data-site-header data-header-ready={isReady} data-home-header={pathname === "/" ? true : undefined} className="marketing-nav fixed! inset-x-0! top-0! z-[1000]! grid! w-full! max-w-none! grid-cols-[1fr_auto]! items-center! gap-4! rounded-none! border-0! bg-black/35 px-[max(1rem,env(safe-area-inset-left))]! pt-[calc(0.75rem+var(--header-safe-top))]! pr-[max(1rem,env(safe-area-inset-right))]! pb-3! text-white! shadow-[0_8px_32px_rgba(0,0,0,0.18)]! backdrop-blur-xl! transform-none! md:grid-cols-[1fr_auto_1fr]! md:px-8! md:pb-2! md:pt-[calc(0.5rem+var(--header-safe-top))]!">
        <a href="/" onClick={(event) => navigateToDocument(event, "/")} className="inline-flex min-h-11 w-fit min-w-0 items-center no-underline!" aria-label={messages.marketingNav.home2.zh} data-aria-label-zh={messages.marketingNav.home2.zh} data-aria-label-en={messages.marketingNav.home2.en}>
          <img
            src="/logo/QiCore-English.svg"
            alt={messages.marketingNav.qicore.zh}
            width={3439}
            height={807}
            className="block h-6 w-auto max-w-full object-contain"
          />
        </a>
        <nav id="home-navigation" data-menu-open={isMenuOpen} aria-label={messages.marketingNav.mainNavigation.zh} data-aria-label-zh={messages.marketingNav.mainNavigation.zh} data-aria-label-en={messages.marketingNav.mainNavigation.en} className={`marketing-nav-links absolute! inset-x-0! top-full! flex-col! items-stretch! gap-1! rounded-none! border-0! bg-black/80! p-4! text-white! opacity-100! shadow-lg! backdrop-blur-xl! transform-none! md:static! md:flex! md:flex-row! md:items-center! md:gap-2! md:bg-transparent! md:p-0! md:shadow-none! md:backdrop-blur-none! ${isMenuOpen ? "flex! pointer-events-auto!" : "hidden! pointer-events-none! md:pointer-events-auto!"}`}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={(event) => navigateToDocument(event, item.href)} className={`flex min-h-11 items-center justify-center rounded-lg! px-4! py-3! text-sm! md:min-h-10! md:py-2! no-underline! transition hover:bg-white/10! focus-visible:outline-2! focus-visible:outline-white! ${pathname === item.href ? "bg-white/10! font-medium! text-white!" : "text-white/75!"}`}>
              <span data-lang="zh">{item.zh}</span><span data-lang="en">{item.en}</span>
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="locale-toggle flex! min-h-11! items-center! gap-2! rounded-full! bg-white/10! px-4! py-2! text-white! md:min-h-10! md:rounded-lg! md:py-1.5!" onClick={toggleLocale} aria-label={localeLabels[locale]} data-aria-label-zh={localeLabels.zh} data-aria-label-en={localeLabels.en}>
            <span className={locale === "zh" ? "is-current" : ""}>{messages.common.languageChinese.zh}</span><i className="bg-white/30!" /><span className={locale === "en" ? "is-current" : ""}>{messages.common.languageEnglish.en}</span>
          </button>
          <button ref={menuToggleRef} type="button" className="marketing-menu-toggle flex! h-11! w-11! flex-col! items-center! justify-center! gap-1.5! rounded-full! border! border-white/20! bg-white/10! md:hidden!" aria-label={messages.marketingNav.toggleNavigation.zh} data-aria-label-zh={messages.marketingNav.toggleNavigation.zh} data-aria-label-en={messages.marketingNav.toggleNavigation.en} aria-controls="home-navigation" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen(value => !value)}>
            <span className={`block! h-px! w-4! bg-white! transition-transform ${isMenuOpen ? "translate-y-[3.5px] rotate-45" : ""}`} /><span className={`block! h-px! w-4! bg-white! transition-transform ${isMenuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </header>
    );
}
