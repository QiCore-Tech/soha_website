"use client";

import { useEffect, useState } from "react";

type Locale = "zh" | "en";

export function OysCatNav() {
  const [locale, setLocale] = useState<Locale>("zh");

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("qicore-locale");
    const initialLocale: Locale = savedLocale === "en" ? "en" : "zh";
    setLocale(initialLocale);
    document.documentElement.dataset.locale = initialLocale;
    document.documentElement.lang = initialLocale === "en" ? "en" : "zh-CN";
  }, []);

  function toggleLocale() {
    const nextLocale: Locale = locale === "zh" ? "en" : "zh";
    setLocale(nextLocale);
    window.localStorage.setItem("qicore-locale", nextLocale);
    document.documentElement.dataset.locale = nextLocale;
    document.documentElement.lang = nextLocale === "en" ? "en" : "zh-CN";
  }

  return (
    <header className="oyscat-nav">
      <a className="oyscat-nav-brand" href="/oyscat" aria-label="OysCat products">
        <img src="/brand/oyscat-wordmark.png" alt="OysCat" />
      </a>
      <span className="oyscat-nav-index">QICORE / PRODUCT 01</span>
      <div className="oyscat-nav-actions">
        <a href="/" className="back-to-qicore" data-qicore-return>
          <span data-lang="zh">返回 QiCore</span><span data-lang="en">QiCore site</span>
        </a>
        <button type="button" onClick={toggleLocale} aria-label="Switch language">
          {locale === "zh" ? "EN" : "中"}
        </button>
      </div>
    </header>
  );
}
