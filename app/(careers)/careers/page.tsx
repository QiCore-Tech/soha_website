import type { Metadata } from "next";
import { CareersBoard } from "@/components/careers-board";
import { CareersNav } from "@/components/careers-nav";
import { BilingualText, MarketingPage } from "@/components/marketing-page";
import { CAREER_FILTERS } from "@/lib/careers-data";
import { getCareerRoles } from "@/lib/feishu-careers";

export const metadata: Metadata = {
  title: "加入 QiCore · Careers",
  description: "查看 QiCore 的开放职位、岗位要求与投递方式。"
};

export default async function CareersPage() {
  const roles = await getCareerRoles();
  const applicationUrl = process.env.CAREERS_APPLICATION_FORM_URL?.trim()
    || "https://bcn87u70v4ke.feishu.cn/share/base/shrcnaavDhY5FxX6kvXOLi7P27g";

  return (
    <>
      <CareersNav />
      <MarketingPage
        pageClassName="careers-page"
        showHero={false}
        eyebrow={{ zh: "QiCore 招聘", en: "QiCore Careers" }}
        title={{ zh: "找到你想做的事。", en: "Find your place." }}
        intro={{
          zh: "这里集中展示当前开放职位、具体岗位要求和投递方式。",
          en: "Explore our current openings, role details, and how to apply."
        }}
      >
        <CareersBoard roles={roles} filters={CAREER_FILTERS} applicationUrl={applicationUrl} />

        <section className="marketing-section careers-note">
          <div className="careers-note-copy">
            <p className="section-kicker"><BilingualText zh="没有看到合适的职位？" en="Nothing that fits?" /></p>
            <p><BilingualText zh="也可以直接联系我们，简单介绍你的经历、擅长的方向和希望参与的工作。" en="You can still introduce yourself. Tell us about your experience, strengths, and the work you hope to do." /></p>
          </div>
          <div className="careers-note-actions">
            <a className="lime-cta" href={applicationUrl} target="_blank" rel="noreferrer">
              <span data-lang="zh">主动投递</span><span data-lang="en">General application</span> <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </MarketingPage>
    </>
  );
}
