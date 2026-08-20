import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

const globalStyles = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

export const metadata: Metadata = {
  metadataBase: new URL("https://qicore.ai"),
  title: {
    default: "气核科技 QiCore | 智能硬件创造平台",
    template: "%s | QiCore"
  },
  description:
    "气核科技 QiCore 官方网站。了解智能硬件创造平台 OysCat、研发动态与团队。",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "气核科技 QiCore | OysCat 智能硬件创造平台",
    description:
      "从灵感到现实，了解 QiCore 与面向智能硬件创造者的全链路工作空间 OysCat。",
    url: "https://qicore.ai/",
    siteName: "气核科技 qicore",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "气核科技 QiCore | OysCat 智能硬件创造平台",
    description:
      "从灵感到现实，了解 QiCore 与面向智能硬件创造者的全链路工作空间 OysCat。"
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
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
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        {children}
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
