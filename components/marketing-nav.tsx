"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export function MarketingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("zh");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("qicore-locale");
    const initialLocale: Locale = savedLocale === "en" ? "en" : "zh";
    setLocale(initialLocale);
    document.documentElement.dataset.locale = initialLocale;
  }, []);

  useEffect(() => {
    document.body.classList.remove(
      "is-qicore-navigating",
      "is-qicore-leaving-home",
      "is-qicore-switching-content"
    );
  }, [pathname]);

  useEffect(() => {
    navItems.forEach((item) => {
      if (item.href !== "/oyscat") router.prefetch(item.href);
    });
  }, [router]);

  function toggleLocale() {
    const nextLocale: Locale = locale === "zh" ? "en" : "zh";
    setLocale(nextLocale);
    window.localStorage.setItem("qicore-locale", nextLocale);
    document.documentElement.dataset.locale = nextLocale;
  }

  function navigateToQiCore(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setIsMenuOpen(false);
    if (href === "/oyscat" || href === pathname) return;

    event.preventDefault();
    router.push(href, { scroll: false });
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
            return item.href === "/oyscat" ? (
              <a
                className={`is-oyscat-product-link${active ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </a>
            ) : (
              <a
                className={active ? "is-active" : undefined}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
                onClick={(event) => navigateToQiCore(event, item.href)}
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
