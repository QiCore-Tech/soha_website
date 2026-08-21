"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { OysCatProductWordmark } from "@/components/oyscat-product-wordmark";

type Locale = "zh" | "en";

const navItems = [
  { href: "/", zh: "首页", en: "Home" },
  { href: "/about", zh: "关于 QiCore", en: "About QiCore" },
  { href: "/news", zh: "新闻与动态", en: "News & Updates" },
  { href: "/team", zh: "团队", en: "Team" },
  { href: "/oyscat", zh: "OysCat 产品", en: "OysCat Products" }
];

const qicoreRoutes = new Set(["/", "/about", "/news", "/team"]);

export function MarketingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navigationTimerRef = useRef<number | null>(null);
  const [locale, setLocale] = useState<Locale>("zh");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("qicore-locale");
    const initialLocale: Locale = savedLocale === "en" ? "en" : "zh";
    setLocale(initialLocale);
    document.documentElement.dataset.locale = initialLocale;
    document.documentElement.lang = initialLocale === "en" ? "en" : "zh-CN";
  }, []);

  useEffect(() => {
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
    qicoreRoutes.forEach((href) => {
      if (href !== pathname) router.prefetch(href);
    });
  }, [pathname, router]);

  function toggleLocale() {
    const nextLocale: Locale = locale === "zh" ? "en" : "zh";
    setLocale(nextLocale);
    window.localStorage.setItem("qicore-locale", nextLocale);
    document.documentElement.dataset.locale = nextLocale;
    document.documentElement.lang = nextLocale === "en" ? "en" : "zh-CN";
  }

  function navigateToDocument(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setIsMenuOpen(false);
    if (href === pathname) {
      event.preventDefault();
      return;
    }

    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || event.currentTarget.target === "_blank"
    ) return;

    const isQiCoreRoute = qicoreRoutes.has(href);
    event.preventDefault();
    document.body.classList.add(isQiCoreRoute ? "is-qicore-client-navigation" : "is-qicore-navigating");

    const commitNavigation = () => {
      if (isQiCoreRoute) {
        window.sessionStorage.removeItem("qicore-route-entry");
        router.push(href, { scroll: false });
        return;
      }

      window.sessionStorage.removeItem("qicore-route-entry");
      window.location.assign(href);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      navigationTimerRef.current = window.setTimeout(commitNavigation, 40);
      return;
    }

    if (pathname === "/") {
      document.body.classList.add("is-qicore-preparing-home-route");
      navigationTimerRef.current = window.setTimeout(() => {
        document.body.classList.add("is-qicore-nav-lifting");
        navigationTimerRef.current = window.setTimeout(() => {
          commitNavigation();
        }, 220);
      }, 280);
      return;
    }

    if (isQiCoreRoute) {
      navigationTimerRef.current = window.setTimeout(commitNavigation, 32);
      return;
    }

    document.body.classList.add("is-qicore-switching-content");
    navigationTimerRef.current = window.setTimeout(() => {
      commitNavigation();
    }, 180);
  }

  return (
    <>
      <header
        className={`marketing-nav is-qicore-site${pathname === "/" ? " is-qicore-home" : " is-qicore-content"}`}
        data-home-interactive-control
      >
        <nav className={`marketing-nav-links${isMenuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {navItems.map((item) => {
            const label = item.href === "/oyscat" ? (
              <OysCatProductWordmark className="qicore-nav-oyscat-wordmark" />
            ) : (
              <><span data-lang="zh">{item.zh}</span><span data-lang="en">{item.en}</span></>
            );
            const active = pathname === item.href;
            return (
              <a
                className={`${item.href === "/oyscat" ? "is-oyscat-product-link" : ""}${active ? " is-active" : ""}`.trim() || undefined}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
                onClick={(event) => navigateToDocument(event, item.href)}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <div className="marketing-nav-actions">
          <button
            className={`marketing-menu-toggle${isMenuOpen ? " is-open" : ""}`}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
          <button className="locale-toggle" type="button" onClick={toggleLocale} aria-label="Switch language">
            <span className={locale === "zh" ? "is-current" : ""}>中</span>
            <i />
            <span className={locale === "en" ? "is-current" : ""}>EN</span>
          </button>
        </div>
      </header>
    </>
  );
}
