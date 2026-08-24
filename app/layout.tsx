import type { Metadata } from "next";
import { ProductTransition } from "@/components/product-transition";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qicore.ai"),
  title: {
    default: "气核科技 QiCore | 智能硬件创造平台",
    template: "%s | QiCore"
  },
  description:
    "气核科技 QiCore 首创生成式物理造物，致力于让每个人实现所想即所造。了解 QiCore、OysCat、最新动态与团队。",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "气核科技 QiCore | OysCat 智能硬件创造平台",
    description:
      "QiCore pioneers a new paradigm for intent-driven physical creation. Discover our work, OysCat, and the team behind it.",
    url: "https://qicore.ai/",
    siteName: "气核科技 qicore",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "气核科技 QiCore | OysCat 智能硬件创造平台",
    description:
      "QiCore pioneers a new paradigm for intent-driven physical creation. Discover our work, OysCat, and the team behind it."
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var root=document.documentElement;try{var locale=window.localStorage.getItem("qicore-locale")==="en"?"en":"zh";root.dataset.locale=locale;root.lang=locale==="en"?"en":"zh-CN";}catch(error){root.dataset.locale="zh";}try{var rawEntry=window.sessionStorage.getItem("qicore-route-entry");window.sessionStorage.removeItem("qicore-route-entry");if(rawEntry){var entry=JSON.parse(rawEntry);var isValidKind=entry.kind==="from-home"||entry.kind==="between-content"||entry.kind==="to-home";if(isValidKind&&entry.target===window.location.pathname&&Date.now()-entry.at<10000){root.dataset.qicoreRouteEntry=entry.kind;}}}catch(error){}try{var productRaw=window.sessionStorage.getItem("qicore-product-transition");window.sessionStorage.removeItem("qicore-product-transition");if(productRaw){var productEntry=JSON.parse(productRaw);var validDirection=productEntry.direction==="to-oyscat"||productEntry.direction==="to-qicore";if(validDirection&&productEntry.target===window.location.pathname&&Date.now()-productEntry.at<10000){root.dataset.productTransitionEntry=productEntry.direction;}}}catch(error){}})();`
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/npm/misans-vf@1.0.0/lib/MiSans.min.css"
        />
      </head>
      <body>
        {children}
        <ProductTransition />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "气核科技",
              alternateName: ["qicore", "杭州炁核科技有限公司", "深圳气核科技有限公司"],
              url: "https://qicore.ai"
            })
          }}
        />
      </body>
    </html>
  );
}
