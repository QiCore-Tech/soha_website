import { MarketingPage } from "@/components/marketing-page";
import { OysCatProductWordmark } from "@/components/oyscat-product-wordmark";

export default function NewsPage() {
  return (
    <MarketingPage
      heroArt="signal"
      eyebrow={{ zh: "新闻与动态", en: "News & Updates" }}
      title={{ zh: "持续发生的创造。", en: "Creation in motion." }}
      intro={{
        zh: "记录 QiCore 与 OysCat 从研发、内测到真实创造的每一步。",
        en: "Follow QiCore as intent-driven physical creation moves from research into the hands of real creators."
      }}
    >
      <section className="marketing-section news-feed">
        <div className="news-feed-heading" data-qicore-waterfall="2">
          <p className="section-kicker">Latest entry</p>
          <span>01 ARTICLE / 2026</span>
        </div>

        <details className="news-entry" data-qicore-waterfall="3">
          <summary>
            <div className="news-entry-cover" aria-hidden="true">
              <span>29</span>
              <svg viewBox="0 0 600 260" role="presentation">
                <path d="M20 164 C78 164 80 116 137 116 S197 198 256 198 S314 68 374 68 S432 144 491 144 S548 94 580 94" />
                <path d="M20 144 C78 144 80 132 137 132 S197 169 256 169 S314 94 374 94 S432 126 491 126 S548 80 580 80" />
              </svg>
              <small>BETA USERS / SIGNAL 01</small>
            </div>

            <div className="news-entry-summary">
              <p className="news-entry-product">
                <OysCatProductWordmark className="qicore-news-oyscat-wordmark" />
                <span>Closed Beta</span>
              </p>
              <time dateTime="2026-08-16">
                <span data-lang="zh">2026.8.16</span>
                <span data-lang="en">August 16, 2026</span>
              </time>
              <h2>
                <span data-lang="zh">气核正式开启首批内测</span>
                <span data-lang="en">QiCore Opens Its First Closed Beta</span>
              </h2>
              <p className="news-entry-deck">
                <span data-lang="zh">29 位来自工程、建造游戏与创意行业的用户，开始用 OysCat 搭建自己的硬件项目。</span>
                <span data-lang="en">Twenty-nine creators are now building their own hardware projects with the first closed beta.</span>
              </p>
              <span className="news-entry-toggle" aria-hidden="true">
                <span className="news-entry-toggle-closed">
                  <span data-lang="zh">展开正文</span>
                  <span data-lang="en">Read story</span>
                </span>
                <span className="news-entry-toggle-open">
                  <span data-lang="zh">收起正文</span>
                  <span data-lang="en">Close story</span>
                </span>
                <i />
              </span>
            </div>
          </summary>

          <div className="news-entry-body">
            <div data-lang="zh">
              <p>气核科技（QiCore）宣布，OysCat 已正式进入首批内测阶段，共招募 29 位内测用户，涵盖工程师、Minecraft 等建造经营游戏爱好者、文艺工作者等多元背景。</p>
              <p>内测版本开放了 OysCat Workspace 与部分硬件模块的核心功能，用户已开始使用 OysCat 搭建各自的硬件项目。</p>
              <p>团队将根据首批用户的实际反馈持续优化 Workspace 的设计流程与模块兼容性。后续将陆续开放更多硬件模块，并计划在未来几个月扩大内测规模。</p>
            </div>
            <div data-lang="en">
              <p>QiCore announced that Oyscat has officially entered its first closed beta phase.</p>
              <p>The program includes 29 beta users from diverse backgrounds, including engineers, Minecraft fans, and creative professionals.</p>
              <p>The closed beta opens access to the core capabilities of the Oyscat system, covering both the Oyscat Workspace and selected hardware modules. Users have already begun building their own hardware projects with Oyscat.</p>
              <p>Feedback from this first group of users will help QiCore refine the design workflow and improve module compatibility. QiCore will continue to release additional hardware modules and plans to expand the closed beta program in the coming months.</p>
            </div>
          </div>
        </details>
      </section>
    </MarketingPage>
  );
}
