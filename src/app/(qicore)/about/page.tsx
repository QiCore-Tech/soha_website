import { messages } from "@/i18n/messages";
import { BilingualText as Bi, MarketingPage } from "@/components/marketing-page";
import { SectionHeading } from "@/components/section-heading";
import { AboutVisual } from "@/features/about/components/about-visual";

const people = [
  { image: "jake", name: messages.about.jakeLuo.zh, english: messages.about.jakeLuo.en, role: messages.about.founderCeo.zh, roleEn: messages.about.founderCeo.en, bio: messages.about.leadsQicoreSStrategyOrganizationAndProductDirection.zh, bioEn: messages.about.leadsQicoreSStrategyOrganizationAndProductDirection.en },
  { image: "wenda", name: messages.about.wendaSheng.zh, english: messages.about.wendaSheng.en, role: messages.about.coFounderCto.zh, roleEn: messages.about.coFounderCto.en, bio: messages.about.leadsTechnicalArchitectureAndRDDrivingGenerative.zh, bioEn: messages.about.leadsTechnicalArchitectureAndRDDrivingGenerative.en },
  { image: "braylen", name: messages.about.braylenHuang.zh, english: messages.about.braylenHuang.en, role: messages.about.coFounderCpo.zh, roleEn: messages.about.coFounderCpo.en, bio: messages.about.ownsProductDefinitionAndExperienceDesignMakingComplex.zh, bioEn: messages.about.ownsProductDefinitionAndExperienceDesignMakingComplex.en },
  { image: "allen", name: messages.about.allenLuo.zh, english: messages.about.allenLuo.en, role: messages.about.headOfManufacturingAndSupplyChain.zh, roleEn: messages.about.headOfManufacturingAndSupplyChain.en, bio: messages.about.overseesManufacturingAndSupplyChainTakingProductsFrom.zh, bioEn: messages.about.overseesManufacturingAndSupplyChainTakingProductsFrom.en },
  { image: "wmd", name: messages.about.wmd.zh, english: messages.about.wmd.en, role: messages.about.headOfHardwareAndEmbeddedSystems.zh, roleEn: messages.about.headOfHardwareAndEmbeddedSystems.en, bio: messages.about.leadsHardwareAndEmbeddedSystemsBuildingTheCore.zh, bioEn: messages.about.leadsHardwareAndEmbeddedSystemsBuildingTheCore.en },
  { image: "zhong", name: messages.about.zhongWanzhen.zh, english: messages.about.zhongWanzhen.en, role: messages.about.headOfMarketing.zh, roleEn: messages.about.headOfMarketing.en, bio: messages.about.leadsMarketingStrategyBrandAndGrowth.zh, bioEn: messages.about.leadsMarketingStrategyBrandAndGrowth.en },
];

export default function AboutPage() {
  return (
    <MarketingPage
      pageClassName="about-page"
      eyebrow={messages.site.about.companyEyebrow}
      title={messages.about.makeSmart}
      intro={messages.about.qicoreTechnologyIsAnAiNativeCompany}
      tone="light"
      backdrop="#f1f1ee"
    >
      <section id="company" aria-labelledby="company-heading" data-about-genpi-section className="border-t border-line bg-white">
        <div className="site-container py-20 md:py-28">
          <SectionHeading
            eyebrow={messages.about.chapterCompany}
            title={messages.about.creationBeginsWithIntent}
            titleId="company-heading"
          />

          <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-16">
            <div data-qicore-waterfall="2">
              <p className="max-w-2xl text-lead text-ink-2">
                <Bi
                  zh={<>{messages.about.generativeAiCanNowConvertHumanIntent.zh}{messages.about.companyPurpose.zh}{messages.about.empowerPersonalizedCreation.zh}</>}
                  en={<>{messages.about.generativeAiCanNowConvertHumanIntent.en} {messages.about.companyPurpose.en}{messages.about.empowerPersonalizedCreation.en}</>}
                />
              </p>
              <dl className="mt-10 grid gap-8 border-t border-line pt-8 max-md:text-center">
                <div>
                  <dt className="text-headline font-semibold text-ink"><Bi zh={messages.about.mission.zh} en={messages.about.mission.en} /></dt>
                  <dd className="mt-2 text-lead text-ink-2"><Bi zh={messages.about.missionStatement.zh} en={messages.about.missionStatement.en} /></dd>
                </div>
                <div>
                  <dt className="text-headline font-semibold text-ink"><Bi zh={messages.about.vision.zh} en={messages.about.vision.en} /></dt>
                  <dd className="mt-2 grid gap-1 text-lead text-ink-2">
                    <span><Bi zh={messages.about.visionCreation.zh} en={messages.about.visionCreation.en} /></span>
                    <span><Bi zh={messages.about.visionIntent.zh} en={messages.about.visionIntent.en} /></span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl bg-surface p-6 md:p-10" data-qicore-waterfall="3">
              <AboutVisual kind="genpi" />
            </div>
          </div>
        </div>
      </section>

      <section id="team" aria-labelledby="team-heading" className="border-t border-line bg-white">
        <div className="site-container py-20 md:py-28">
          <SectionHeading
            eyebrow={messages.site.about.teamEyebrow}
            title={messages.about.ourTeam}
            lead={messages.site.about.teamLead}
            titleId="team-heading"
          />

          <div className="about-team-track mt-14 flex snap-x snap-mandatory gap-x-5 pb-3 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10 lg:grid-cols-6 lg:gap-x-5">
            {people.map((person) => (
              <article key={person.image} data-qicore-waterfall="5" className="w-[64%] max-w-64 min-w-0 shrink-0 snap-start md:w-auto md:max-w-none">
                <div className="block w-full overflow-hidden rounded-xl bg-surface">
                  {/* Local static assets do not need an image optimization server. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/media/v3/${person.image}.webp`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[4/5] w-full object-cover object-top transition-transform duration-500 hover:scale-[1.03] md:aspect-[3/4] lg:aspect-[4/5]"
                  />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-ink"><Bi zh={person.name} en={person.english} /></h3>
                <p className="mt-1 font-mono text-[13px] text-ink-3"><Bi zh={person.role} en={person.roleEn} /></p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
