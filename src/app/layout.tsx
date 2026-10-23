
import { messages, localeCssProperties } from "@/i18n/messages";
import type { CSSProperties } from "react";
import { localeInitScript } from "@/i18n/init-script";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { SiteScrollReveal } from "@/components/site-scroll-reveal";
import { GlobalClickSpark } from "@/components/click-spark";
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/configs/site";
import { seoCopy, SHARE_IMAGE, websiteStructuredData } from "@/configs/seo";
// Cached route snapshots never load route CSS chunks, so every module a
// content page renders with is loaded globally here.
import "../features/about/components/about-visual.module.css";
import "../components/image-zoom.module.css";
import "./globals.css";
import "../features/legacy-voxel/fun-home.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Browser chrome owns the safe viewport; do not extend underneath it.
  viewportFit: "auto"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.canonicalOrigin),
  title: {
    default: seoCopy.defaultTitle.zh,
    template: messages.common.titleTemplate.zh
  },
  description: seoCopy.defaultDescription.zh,
  keywords: seoCopy.keywords.zh.split(",").map((keyword) => keyword.trim()).filter(Boolean),
  authors: [{ name: "深圳气核科技有限公司", url: siteConfig.canonicalOrigin }],
  creator: "深圳气核科技有限公司",
  publisher: "深圳气核科技有限公司",
  category: "AI 造物系统、智能硬件与电子模块",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: seoCopy.defaultTitle.zh,
    description: seoCopy.defaultDescription.zh,
    url: "https://qicore.ai/",
    siteName: messages.common.companyName.zh,
    locale: "zh_CN",
    type: "website",
    images: [{ url: SHARE_IMAGE.path, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height, alt: SHARE_IMAGE.alt }]
  },
  twitter: {
    card: "summary_large_image",
    site: "@Oyscat",
    creator: "@Oyscat",
    title: seoCopy.defaultTitle.zh,
    description: seoCopy.defaultDescription.zh,
    images: [SHARE_IMAGE.path]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  },
  formatDetection: { telephone: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" style={localeCssProperties.zh as CSSProperties} suppressHydrationWarning className="has-[[data-home-carousel]]:cursor-auto! has-[[data-site-header]]:perspective-none!">
      <head>
        <script
          id="qicore-i18n-data"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ common: messages.common, runtime: messages.runtime, staticArchive: messages.staticArchive }).replace(/</g, "\\u003c")
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var root=document.documentElement;${localeInitScript}try{var rawEntry=window.sessionStorage.getItem("qicore-route-entry");window.sessionStorage.removeItem("qicore-route-entry");if(rawEntry){var entry=JSON.parse(rawEntry);var isValidKind=entry.kind==="from-home"||entry.kind==="between-content"||entry.kind==="to-home";if(isValidKind&&entry.target===window.location.pathname&&Date.now()-entry.at<10000){root.dataset.qicoreRouteEntry=entry.kind;}}}catch(error){}})();`
          }}
        />
      </head>
      {/* Browser extensions may add body attributes before hydration; suppression is limited to this element. */}
      <body suppressHydrationWarning className="has-[[data-home-carousel]]:cursor-auto! has-[[data-site-header]]:perspective-none!">
        <MarketingNav />
        {children}
        <MarketingFooter />
        <SiteScrollReveal />
        <GlobalClickSpark />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c")
          }}
        />
      </body>
    </html>
  );
}
