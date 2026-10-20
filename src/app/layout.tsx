
import { messages, localeCssProperties } from "@/i18n/messages";
import type { CSSProperties } from "react";
import { localeInitScript } from "@/i18n/init-script";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { SiteScrollReveal } from "@/components/site-scroll-reveal";
import { GlobalClickSpark } from "@/components/click-spark";
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/configs/site";
import oyscatLayoutStyles from "./(qicore)/oyscat/oyscat.module.css";
// Cached route snapshots never load route CSS chunks, so every module a
// content page renders with is loaded globally here.
import "../features/about/components/about-visual.module.css";
import "../components/image-zoom.module.css";
import "../features/oyscat/components/oyscat-image.module.css";
import "../features/oyscat/components/oyscat-testimonials.module.css";
import "../features/oyscat/components/logo-loop.module.css";
import "../features/oyscat/components/oyscat-pixel-scenes.module.css";
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
    default: messages.pageTitles.qicoreTechnologyThinkItMakeIt.zh,
    template: messages.common.titleTemplate.zh
  },
  description:
    messages.layout.qicoreQicoreOyscat.zh,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: messages.layout.qicoreTechnologyThinkItMakeIt.zh,
    description:
      messages.layout.qicoreIsBuildingToolsForIntentDriven.zh,
    url: "https://qicore.ai/",
    siteName: messages.layout.qicoreTechnology.zh,
    type: "website"
  },
  twitter: {
    card: "summary",
    title: messages.layout.qicoreTechnologyThinkItMakeIt.zh,
    description:
      messages.layout.qicoreIsBuildingToolsForIntentDriven.zh
  },
  icons: {
    icon: "/favicon.svg"
  }
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
            __html: `(function(){var root=document.documentElement;${localeInitScript}try{var rawEntry=window.sessionStorage.getItem("qicore-route-entry");window.sessionStorage.removeItem("qicore-route-entry");if(rawEntry){var entry=JSON.parse(rawEntry);var isValidKind=entry.kind==="from-home"||entry.kind==="between-content"||entry.kind==="to-home";if(isValidKind&&entry.target===window.location.pathname&&Date.now()-entry.at<10000){root.dataset.qicoreRouteEntry=entry.kind;}}}catch(error){}try{var productRaw=window.sessionStorage.getItem("qicore-product-transition");window.sessionStorage.removeItem("qicore-product-transition");if(productRaw){var productEntry=JSON.parse(productRaw);var validDirection=productEntry.direction==="to-oyscat"||productEntry.direction==="to-qicore";if(validDirection&&productEntry.target===window.location.pathname&&Date.now()-productEntry.at<10000){root.dataset.productTransitionEntry=productEntry.direction;}}}catch(error){}})();`
          }}
        />
      </head>
      {/* Browser extensions may add body attributes before hydration; suppression is limited to this element. */}
      <body suppressHydrationWarning className={`${oyscatLayoutStyles.siteStyles} has-[[data-home-carousel]]:cursor-auto! has-[[data-site-header]]:perspective-none!`}>
        <MarketingNav />
        {children}
        <MarketingFooter />
        <SiteScrollReveal />
        <GlobalClickSpark />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: messages.layout.qicoreTechnology2.zh,
              alternateName: messages.common.organizationAliases.map((text) => text.zh),
              url: "https://qicore.ai"
            })
          }}
        />
      </body>
    </html>
  );
}
