"use client";

import { messages, formatMessage } from "@/i18n/messages";

import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import type { CareerRole, CareerText } from "@/features/careers/data/careers-data";
import { useCareerDisclosureAnimation } from "@/features/careers/hooks/use-career-disclosure-animation";
import { buttonVariants } from "@/components/ui/button";

type CareersBoardProps = {
  roles: CareerRole[];
  filters: CareerText[];
  applicationUrl: string;
};

function Localized({ text, className }: { text: CareerText; className?: string }) {
  return (
    <>
      <span className={className} data-lang="zh">{text.zh}</span>
      <span className={className} data-lang="en">{text.en}</span>
    </>
  );
}

function RoleList({ items, emptyLabel }: { items: CareerText[]; emptyLabel: CareerText }) {
  if (!items.length) {
    return <p className="text-[14px] leading-relaxed text-ink-3"><Localized text={emptyLabel} /></p>;
  }

  return (
    <ul className="grid gap-2.5">
      {items.map((item) => (
        <li key={`${item.zh}-${item.en}`} className="relative pl-4 text-[14px] leading-[1.75] text-ink-2 before:absolute before:left-0 before:top-[0.62em] before:size-[5px] before:rounded-full before:bg-ink-3 before:content-['']">
          <Localized text={item} />
        </li>
      ))}
    </ul>
  );
}

function RoleColumn({ title, items, empty }: { title: CareerText; items: CareerText[]; empty: CareerText }) {
  return (
    <div className="">
      <h3 className="mb-4 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
        <Localized text={title} />
      </h3>
      <RoleList items={items} emptyLabel={empty} />
    </div>
  );
}

export function CareersBoard({ roles, filters, applicationUrl }: CareersBoardProps) {
  const rootRef = useRef<HTMLElement>(null);
  useCareerDisclosureAnimation(rootRef);
  const [activeFilter, setActiveFilter] = useState("all");
  const latestRoleMonth = useMemo(() => {
    const latestDate = roles.map((role) => role.postedAt).sort().at(-1);
    return latestDate ? latestDate.slice(0, 7).replace("-", ".") : "—";
  }, [roles]);
  const activeRoles = useMemo(
    () => activeFilter === "all" ? roles : roles.filter((role) => role.team.en === activeFilter),
    [activeFilter, roles]
  );

  return (
    <section ref={rootRef} id="roles" className="careers-open-roles scroll-mt-[calc(var(--site-header-h)+16px)] border-t border-line bg-white" aria-labelledby="careers-open-roles">
      <div className="site-container py-16 md:py-24">
        <header className="flex flex-wrap items-end justify-between gap-6" data-scroll-reveal>
          <div>
            <p className="eyebrow text-ink-3"><Localized text={messages.site.careers.openRoles} /></p>
            <h2 id="careers-open-roles" className="mt-3 font-heading text-title font-semibold tracking-tight text-ink">
              <span data-lang="zh">{messages.careersBoard.openRoles.zh}</span>
              <span data-lang="en">{messages.careersBoard.openRoles.en}</span>
            </h2>
          </div>
          <p className="font-mono text-[13px] text-ink-3">
            <span data-lang="zh">{formatMessage(messages.runtime.roleCount, "zh", { count: activeRoles.length })}</span>
            <span data-lang="en">{formatMessage(activeRoles.length === 1 ? messages.runtime.roleCountOne : messages.runtime.roleCount, "en", { count: activeRoles.length })}</span>
            <span aria-hidden="true"> · </span>
            <span data-lang="zh">{formatMessage(messages.runtime.rolesUpdated, "zh", { date: latestRoleMonth })}</span>
            <span data-lang="en">{formatMessage(messages.runtime.rolesUpdated, "en", { date: latestRoleMonth })}</span>
          </p>
        </header>

        <p className="mt-5 max-w-2xl text-lead text-ink-2">
          <span data-lang="zh">{messages.careersBoard.weAreLookingForPeopleWhoThink.zh}</span>
          <span data-lang="en">{messages.careersBoard.weAreLookingForPeopleWhoThink.en}</span>
        </p>

        {filters.length > 1 && (
          <div
            data-scroll-reveal
            className="mt-10 flex flex-wrap items-center gap-2"
            role="group"
            aria-label={messages.careersBoard.filterOpenRoles.zh}
            data-aria-label-zh={messages.careersBoard.filterOpenRoles.zh}
            data-aria-label-en={messages.careersBoard.filterOpenRoles.en}
          >
            {filters.map((filter, index) => {
              const key = index === 0 ? "all" : filter.en;
              const isActive = activeFilter === key;
              return (
                <button
                  key={filter.en}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(key)}
                  className={`inline-flex min-h-10 items-center rounded-full border px-4 text-[13px] transition-colors ${
                    isActive ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink-3 hover:text-ink"
                  }`}
                >
                  <Localized text={filter} />
                </button>
              );
            })}
          </div>
        )}

        {activeRoles.length ? (
          <div className="mt-8">
            {activeRoles.map((role) => (
              <details className="career-entry group border-b border-line" key={role.id}>
                <summary
                  data-scroll-reveal
                  className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-7 md:gap-8 md:py-9 [&::-webkit-details-marker]:hidden"
                >
                  <span className="grid min-w-0 gap-2">
                    <span className="flex flex-wrap items-center gap-2 font-mono text-[12px] tracking-[0.04em] text-ink-3">
                      <Localized text={role.team} />
                      <i aria-hidden="true" className="not-italic">·</i>
                      <Localized text={role.location} />
                      <i aria-hidden="true" className="not-italic">·</i>
                      <Localized text={role.type} />
                    </span>
                    <strong className="text-[clamp(1.375rem,2.2vw,2rem)] leading-[1.1] font-semibold tracking-tight text-ink text-balance">
                      <Localized text={role.title} />
                    </strong>
                    <span className="max-w-[62ch] text-[15px] leading-[1.7] text-ink-2 max-md:hidden">
                      <Localized text={role.summary} />
                    </span>
                  </span>
                  <ChevronRight
                    className="career-entry-arrow mt-1 size-5 shrink-0 self-start text-ink-3"
                    aria-hidden="true"
                  />
                </summary>

                <div className="career-entry-body grid gap-8 pb-10 md:gap-10 md:pb-12">
                  <p className="border-b border-line pb-4 font-mono text-[12px] tracking-[0.04em] text-ink-3">
                    <span data-lang="zh">{formatMessage(messages.runtime.rolePosted, "zh", { date: role.postedAt.replaceAll("-", ".") })}</span>
                    <span data-lang="en">{formatMessage(messages.runtime.rolePosted, "en", { date: role.postedAt.replaceAll("-", ".") })}</span>
                  </p>

                  <div className="grid gap-8 md:grid-cols-3 md:gap-10">
                    <RoleColumn
                      title={messages.careersBoard.whatYouWillDo}
                      items={role.responsibilities}
                      empty={messages.careersBoard.detailsComingSoon}
                    />
                    <RoleColumn
                      title={messages.careersBoard.whatWeAreLookingFor}
                      items={role.requirements}
                      empty={messages.careersBoard.detailsComingSoon}
                    />
                    <RoleColumn
                      title={messages.careersBoard.niceToHave}
                      items={role.niceToHave}
                      empty={messages.careersBoard.noExtraRequirements}
                    />
                  </div>

                  <div className="rounded-2xl bg-surface p-6 md:p-7">
                    <h3 className="mb-4 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
                      <span data-lang="zh">{messages.careersBoard.workingHere.zh}</span>
                      <span data-lang="en">{messages.careersBoard.workingHere.en}</span>
                    </h3>
                    <RoleList items={role.benefits} emptyLabel={messages.careersBoard.weCanTalkThroughTheDetails} />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-6">
                    <div className="flex flex-wrap gap-2">
                      {role.tags.map((tag) => (
                        <span key={tag.en} className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-[12px] text-ink-2">
                          <Localized text={tag} />
                        </span>
                      ))}
                    </div>
                    <a
                      className={buttonVariants({ variant: "pill", size: "pill" })}
                      href={applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span data-lang="zh">{messages.careersBoard.applyForThisRole.zh}</span>
                      <span data-lang="en">{messages.careersBoard.applyForThisRole.en}</span>
                      <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="mt-10 border-t border-line pt-10">
            <p className="max-w-[52ch] text-lead text-ink-2">
              <span data-lang="zh">{messages.careersBoard.noOpenRolesMatchRightNowIntroduce.zh}</span>
              <span data-lang="en">{messages.careersBoard.noOpenRolesMatchRightNowIntroduce.en}</span>
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
