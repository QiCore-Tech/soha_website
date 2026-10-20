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
      name: "Oyscat 官网｜深圳气核科技有限公司 QiCore",
      alternateName: ["Oyscat 官网", "Oyscat Official", "气核科技官网", "QiCore"],
      description: seoCopy.defaultDescription.zh,
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: ["zh-CN", "en"]
    }
  ]
} as const;

export const oyscatStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "@id": `${SEO_ORIGIN}/oyscat#product`,
      name: "Oyscat",
      alternateName: ["Oyscat 官网", "Oyscat Workspace", "Oyscat AI 造物系统"],
      description: seoCopy.productDescription.zh,
      image: [`${SEO_ORIGIN}${SHARE_IMAGE.path}`],
      url: `${SEO_ORIGIN}/oyscat`,
      category: ["AI 造物系统", "电子模块", "智能硬件", "生成式 AI 设计"],
      brand: { "@id": ORGANIZATION_ID },
      manufacturer: { "@id": ORGANIZATION_ID },
      additionalProperty: [
        { "@type": "PropertyValue", name: "产品状态", value: "封闭内测" },
        { "@type": "PropertyValue", name: "运行平台", value: "Web + 实体电子模块" },
        { "@type": "PropertyValue", name: "核心能力", value: "AI 建模、实时仿真、电子模块编程、3D 打印" }
      ]
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SEO_ORIGIN}/oyscat#workspace`,
      name: "Oyscat Workspace",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      description: "Oyscat Workspace 支持自然语言生成模型、结构拼搭、控制程序编写与实时仿真，并可衔接实体电子模块完成造物。",
      url: `${SEO_ORIGIN}/oyscat`,
      isPartOf: { "@id": `${SEO_ORIGIN}/oyscat#product` },
      publisher: { "@id": ORGANIZATION_ID }
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
