import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qicore.ai"),
  title: "气核科技（qicore）| 智能硬件创造平台",
  description:
    "气核科技（qicore）官方网站。我们专注于智能硬件创造与新一代平台研发，欢迎了解公司业务，也欢迎优秀人才加入我们。",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "气核科技（qicore）| 智能硬件创造平台",
    description:
      "气核科技（qicore）官方网站。我们专注于智能硬件创造与新一代平台研发，欢迎了解公司业务，也欢迎优秀人才加入我们。",
    url: "https://qicore.ai/",
    siteName: "气核科技 qicore",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "气核科技（qicore）| 智能硬件创造平台",
    description:
      "气核科技（qicore）官方网站。我们专注于智能硬件创造与新一代平台研发，欢迎了解公司业务，也欢迎优秀人才加入我们。"
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
              alternateName: "qicore",
              url: "https://qicore.ai"
            })
          }}
        />
      </body>
    </html>
  );
}
