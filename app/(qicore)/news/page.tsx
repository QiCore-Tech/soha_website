import { MarketingPage } from "@/components/marketing-page";
import { OysCatProductWordmark } from "@/components/oyscat-product-wordmark";
import { NewsEntryInteraction } from "@/components/news-entry-interaction";

export default function NewsPage() {
  return (
    <MarketingPage
      heroArt="signal"
      pageClassName="news-page"
      eyebrow={{ zh: "新闻与动态", en: "News & Updates" }}
      title={{ zh: "创造，正在继续。", en: "Creation in motion." }}
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
              <img
                src="/media/oyscat-generated-v2/oyscat-beta-qicore-lineart-wide-v2.png"
                alt=""
                loading="eager"
                decoding="async"
              />
              <span className="news-entry-count">29</span>
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
                <span data-lang="zh">29 位来自工程、建造游戏与创意行业的用户，开始用 OysCat 搭建自己的项目。</span>
                <span data-lang="en">Twenty-nine creators are now building their own projects with the first closed beta.</span>
              </p>
              <NewsEntryInteraction />
            </div>
          </summary>

          <div className="news-entry-body">
            <div data-lang="zh">
              <p>气核科技（QiCore）宣布，OysCat 已正式进入首批内测阶段，共招募 29 位内测用户，涵盖工程师、Minecraft 等建造经营游戏爱好者、文艺工作者等多元背景。</p>
              <p>内测版本开放了 OysCat Workspace 与部分硬件模块的核心功能，用户已开始使用 OysCat 搭建各自的硬件项目。</p>
              <p>团队将根据实际反馈持续优化 Workspace 的设计流程与模块兼容性，后续将陆续开放更多硬件模块，并计划扩大内测规模。</p>
            </div>
            <div data-lang="en">
              <p>QiCore announced that OysCat has officially entered its first closed beta phase.</p>
              <p>The program includes 29 beta users from diverse backgrounds, including engineers, Minecraft fans, and creative professionals.</p>
              <p>The closed beta opens access to the core capabilities of the OysCat system, covering both the OysCat Workspace and selected hardware modules. Users have started building their own hardware projects with OysCat. Feedback from this first group of users will help QiCore refine the design workflow and improve module compatibility. QiCore will continue to release additional hardware modules and plans to expand the closed beta program in the coming months.</p>
            </div>
          </div>
        </details>
      </section>
    </MarketingPage>
  );
}
