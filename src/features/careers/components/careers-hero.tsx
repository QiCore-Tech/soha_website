import { messages } from "@/i18n/messages";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { BilingualText as Bi } from "@/components/bilingual-text";

const container = "mx-auto! w-full max-w-(--site-content-max) px-(--site-gutter)!";

const button = "inline-flex min-h-13 items-center justify-center gap-2 px-7! text-[15px] font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black! md:min-h-[3.875rem] md:px-10! md:text-[17px]";

// First screen of /careers. The eyebrow and headline are a fixed zh/en pair
// in both locales; the intro and buttons follow the active language.
export function CareersHero({ applicationUrl }: { applicationUrl: string }) {
  return (
    // Fills the first screen below the nav: .careers-page reserves 94px on top (74px at ≤620px).
    <section className="careers-hero flex min-h-[calc(100svh-94px)] flex-col justify-center bg-white max-[620px]:min-h-[calc(100svh-74px)]" aria-labelledby="careers-hero-title">
      <div className={`${container} py-16! md:py-20!`} data-qicore-waterfall="0">
        <p className="inline-flex items-center gap-3 border border-[#1d1d1f]/15 px-3.5! py-1.5! font-mono text-[10px] font-medium tracking-[0.22em] text-[#686860] uppercase md:text-xs">
          <span aria-hidden="true" className="size-2 shrink-0 bg-[#1d1d1f]" />
          <span>{messages.careers.joinQicore.zh} / <span lang="en">{messages.careers.joinQicore.en}</span></span>
        </p>

        <h1 id="careers-hero-title" className="mt-8! text-[clamp(2.75rem,5.2vw,6rem)] leading-[1.08] tracking-[-0.02em] md:mt-10!">
          <span className="block font-black text-black">{messages.careers.findYourPlace.zh}</span>
          <span lang="en" className="block font-semibold tracking-[-0.04em] text-[#5c5c5c]">{messages.careers.findYourPlace.en}</span>
        </h1>

        <p className="mt-8! max-w-[37em] text-base leading-[1.8] text-[#55524d] md:mt-12! md:text-[clamp(1.125rem,1.4vw,1.5rem)]">
          <Bi zh={messages.careers.exploreOurCurrentOpeningsRoleDetailsAnd.zh} en={messages.careers.exploreOurCurrentOpeningsRoleDetailsAnd.en} />
        </p>

        <div className="mt-10! flex flex-wrap gap-4 md:mt-16! md:gap-5">
          <a href="#careers-open-roles" className={`${button} border border-black! bg-black! text-white! hover:bg-[#262626]!`}>
            <Bi zh={messages.careers.viewRoles.zh} en={messages.careers.viewRoles.en} />
            <ArrowDown className="size-4 shrink-0" aria-hidden="true" />
          </a>
          <a href={applicationUrl} target="_blank" rel="noreferrer" className={`${button} border border-[#1d1d1f]! bg-white! text-[#1d1d1f]! hover:bg-[#1d1d1f]/5!`}>
            <Bi zh={messages.careers.generalApplication.zh} en={messages.careers.generalApplication.en} />
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
