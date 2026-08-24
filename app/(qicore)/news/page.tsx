import { BilingualText, MarketingPage } from "@/components/marketing-page";

const newsCategories = [
  { code: "R&D", zh: "研发进展", en: "Research & development" },
  { code: "RELEASE", zh: "产品发布", en: "Product releases" },
  { code: "UPDATE", zh: "重要公告", en: "Announcements" },
  { code: "STORY", zh: "品牌故事", en: "Brand stories" }
];

export default function NewsPage() {
  return (
    <MarketingPage
      heroArt="signal"
      eyebrow={{ zh: "新闻与动态", en: "News & Updates" }}
      title={{ zh: "持续发生的创造。", en: "Creation in motion." }}
      intro={{
        zh: "关注 QiCore 与 OysCat 的研发进展、产品发布和团队故事。首批正式内容正在整理，这里先呈现清晰的内容入口。",
        en: "Follow QiCore and OysCat across research, releases, announcements, and stories. Our first editorial collection is on the way."
      }}
    >
      <section className="marketing-section news-grid">
        {newsCategories.map((category, index) => (
          <article className="news-card" data-qicore-waterfall={index + 2} key={category.code}>
            <div>
              <span className="news-index">0{index + 1}</span>
              <span className="news-code">{category.code}</span>
            </div>
            <h2><BilingualText zh={category.zh} en={category.en} /></h2>
            <p><BilingualText zh="内容筹备中" en="Stories coming soon" /></p>
          </article>
        ))}
      </section>
    </MarketingPage>
  );
}
