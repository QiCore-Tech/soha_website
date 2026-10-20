import { messages } from "@/i18n/messages";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { CareersBoard } from "@/features/careers/components/careers-board";
import { BilingualText as Bi, MarketingPage } from "@/components/marketing-page";
import { SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { CAREER_FILTERS } from "@/features/careers/data/careers-data";
import { getCareerRoles } from "@/services/server/feishu-careers";

export const metadata: Metadata = {
  title: messages.careers.qicoreCareers.zh,
  description: messages.careers.exploreQicoreSOpenRolesRequirementsAndHow.zh
};

const steps = [
  {
    index: messages.careers.step01,
    zh: messages.careers.apply.zh,
    en: messages.careers.apply.en,
    copyZh: messages.careers.sendYourBackgroundAndWorkSoWeCan.zh,
    copyEn: messages.careers.sendYourBackgroundAndWorkSoWeCan.en
  },
  {
    index: messages.careers.step02,
    zh: messages.careers.talk.zh,
    en: messages.careers.talk.en,
    copyZh: messages.careers.talkWithTheTeamAboutYourProjectsQuestions.zh,
    copyEn: messages.careers.talkWithTheTeamAboutYourProjectsQuestions.en
  },
  {
    index: messages.careers.step03,
    zh: messages.careers.build.zh,
    en: messages.careers.build.en,
    copyZh: messages.careers.whenItFitsBothWaysStartBringingIdeas.zh,
    copyEn: messages.careers.whenItFitsBothWaysStartBringingIdeas.en
  }
];

export default async function CareersPage() {
  const roles = await getCareerRoles();
  const applicationUrl = process.env.CAREERS_APPLICATION_FORM_URL?.trim()
    || "https://bcn87u70v4ke.feishu.cn/share/base/shrcnaavDhY5FxX6kvXOLi7P27g";

  return (
    <MarketingPage
      pageClassName="careers-page"
      eyebrow={messages.site.careers.heroEyebrow}
      title={messages.careers.findYourPlace}
      intro={messages.careers.exploreOurCurrentOpeningsRoleDetailsAnd}
      tone="light"
      backdrop="#efefec"
      actions={[
        { href: "#roles", label: messages.site.careers.viewRoles, emphasis: "primary" },
        { href: "#general", label: messages.careers.generalApplication, emphasis: "secondary" }
      ]}
    >
      <CareersBoard roles={roles} filters={CAREER_FILTERS} applicationUrl={applicationUrl} />

      <section aria-labelledby="careers-process-heading" className="border-t border-line bg-surface">
        <div className="site-container py-20 md:py-24">
          <SectionHeading
            eyebrow={messages.site.careers.processEyebrow}
            title={messages.careers.fromHelloToShipped}
            titleId="careers-process-heading"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {steps.map((step) => (
              <div key={step.index.en} data-qicore-waterfall="4" className="rounded-2xl bg-white p-7">
                <span className="font-mono text-[13px] text-ink-3"><Bi zh={step.index.zh} en={step.index.en} /></span>
                <h3 className="mt-4 text-headline font-semibold tracking-tight text-ink"><Bi zh={step.zh} en={step.en} /></h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2"><Bi zh={step.copyZh} en={step.copyEn} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="general" aria-labelledby="careers-cta-heading" className="scroll-mt-[calc(var(--site-header-h)+16px)] bg-night text-white">
        <div className="site-container py-20 text-center md:py-28">
          <SectionHeading
            eyebrow={messages.careers.text04GeneralApplication}
            title={messages.careers.nothingThatFits}
            lead={messages.careers.youCanStillIntroduceYourselfTellUs}
            tone="dark"
            titleId="careers-cta-heading"
            waterfall="5"
          />
          <div className="mt-9 flex justify-center">
            <a href={applicationUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "pill-inverse", size: "pill" })}>
              <Bi zh={messages.careers.generalApplication.zh} en={messages.careers.generalApplication.en} />
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
