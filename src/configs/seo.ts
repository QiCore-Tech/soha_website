import type { Metadata } from "next";
import { messages } from "@/i18n/messages";
import { siteConfig } from "@/configs/site";

export const seoCopy = messages.seo;

export const SEO_ORIGIN = siteConfig.canonicalOrigin;
export const ORGANIZATION_ID = `${SEO_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SEO_ORIGIN}/#website`;

export const SHARE_IMAGE = {
  path: "/media/v3/virtual-physical-hero-v2.png",
  width: 1672,
  height: 941,
  alt: "Oyscat AI 造物系统与电子模块"
} as const;

export const SOCIAL_PROFILE_URLS = [
  "https://space.bilibili.com/3745036743215474",
  "https://xhslink.cn/m/85xQ3j0HIh4",
  "https://www.facebook.com/share/1baynW2wi6/",
  "https://www.instagram.com/oyscat_official",
  "https://x.com/Oyscat",
  "https://www.youtube.com/@OyscatOfficial/videos"
] as const;

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: messages.common.companyName.zh,
      legalName: seoCopy.organizationLegalName.zh,
      alternateName: ["QiCore", "QiCore Technology", "气核科技", "Shenzhen QiCore Technology Co., Ltd."],
      url: SEO_ORIGIN,
      logo: `${SEO_ORIGIN}/brand/oyscat-symbol.svg`,
      image: `${SEO_ORIGIN}${SHARE_IMAGE.path}`,
      description: seoCopy.organizationDescription.zh,
      email: "info@qicore.ai",
      sameAs: SOCIAL_PROFILE_URLS,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "info@qicore.ai",
        availableLanguage: ["zh-CN", "en"]
      },
      knowsAbout: ["AI 原生造物", "生成式 AI 建模", "实时仿真", "电子模块", "智能硬件", "3D 打印"]
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SEO_ORIGIN,
      name: "QiCore 官网｜深圳气核科技有限公司",
      alternateName: ["QiCore 官网", "QiCore Official", "气核科技官网", "Oyscat 官网"],
      description: seoCopy.defaultDescription.zh,
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: ["zh-CN", "en"]
    }
  ]
} as const;

type PageMetadataInput = {
  title: string;
  description: string;
  path: `/${string}`;
  keywords?: string;
  noIndex?: boolean;
};

export function createPageMetadata({ title, description, path, keywords, noIndex = false }: PageMetadataInput): Metadata {
  const canonical = new URL(path, SEO_ORIGIN).toString();
  const keywordList = (keywords ?? seoCopy.keywords.zh).split(",").map((keyword) => keyword.trim()).filter(Boolean);

  return {
    title: { absolute: title },
    description,
    keywords: keywordList,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: canonical,
      siteName: messages.common.companyName.zh,
      title,
      description,
      images: [{ url: SHARE_IMAGE.path, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height, alt: SHARE_IMAGE.alt }]
    },
    twitter: {
      card: "summary_large_image",
      site: "@Oyscat",
      creator: "@Oyscat",
      title,
      description,
      images: [SHARE_IMAGE.path]
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {})
  };
}
