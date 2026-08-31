"use client";

import { useEffect, useState } from "react";

type Locale = "zh" | "en";

export function CareersNav() {
  const [locale, setLocale] = useState<Locale>("zh");

  useEffect(() => {
    const initialLocale: Locale = window.localStorage.getItem("qicore-locale") === "en" ? "en" : "zh";
    setLocale(initialLocale);
  }, []);

  function toggleLocale() {
    const nextLocale: Locale = locale === "zh" ? "en" : "zh";
    setLocale(nextLocale);
    window.localStorage.setItem("qicore-locale", nextLocale);
    document.documentElement.dataset.locale = nextLocale;
    document.documentElement.lang = nextLocale === "en" ? "en" : "zh-CN";
  }

  return (
    <header className="careers-standalone-nav">
      <a className="careers-back-link" href="/">
        <span aria-hidden="true">←</span>
        <span data-lang="zh">返回 QiCore 官网</span>
        <span data-lang="en">Back to QiCore</span>
      </a>
      <button className="locale-toggle" type="button" onClick={toggleLocale} aria-label="Switch language">
        <span className={locale === "zh" ? "is-current" : ""}>中</span>
        <i />
        <span className={locale === "en" ? "is-current" : ""}>EN</span>
      </button>
    </header>
  );
}
