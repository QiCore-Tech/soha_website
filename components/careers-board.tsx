"use client";

import { useMemo, useState } from "react";
import type { CareerRole, CareerText } from "@/lib/careers-data";

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
    return <p className="careers-role-empty"><Localized text={emptyLabel} /></p>;
  }

  return (
    <ul className="careers-role-list">
      {items.map((item) => (
        <li key={`${item.zh}-${item.en}`}><Localized text={item} /></li>
      ))}
    </ul>
  );
}

export function CareersBoard({ roles, filters, applicationUrl }: CareersBoardProps) {
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
    <section className="marketing-section careers-board" aria-labelledby="careers-open-roles">
      <div className="careers-board-heading">
        <div>
          <p className="section-kicker"><span data-lang="zh">加入 QiCore</span><span data-lang="en">Join QiCore</span></p>
          <h2 id="careers-open-roles">
            <span data-lang="zh">开放职位</span>
            <span data-lang="en">Open roles</span>
          </h2>
        </div>
        <div className="careers-board-aside">
          <p>
            <span data-lang="zh">我们在找愿意把事情想清楚、做出来，也愿意和团队一起成长的人。</span>
            <span data-lang="en">We are looking for people who think clearly, build carefully, and want to grow with the team.</span>
          </p>
          <div className="careers-quick-actions">
            <a className="careers-quick-link" href={applicationUrl} target="_blank" rel="noreferrer">
              <span data-lang="zh">主动投递</span><span data-lang="en">General application</span><span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>

      <div className="careers-filters" role="group" aria-label="Filter open roles">
        {filters.map((filter, index) => {
          const key = index === 0 ? "all" : filter.en;
          const isActive = activeFilter === key;
          return (
            <button
              className={isActive ? "is-active" : undefined}
              key={filter.en}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveFilter(key)}
            >
              <Localized text={filter} />
            </button>
          );
        })}
      </div>

      <div className="careers-results-head">
        <span><span data-lang="zh">{activeRoles.length} 个职位</span><span data-lang="en">{activeRoles.length} {activeRoles.length === 1 ? "role" : "roles"}</span></span>
        <span className="careers-results-note"><span data-lang="zh">最后更新 · {latestRoleMonth}</span><span data-lang="en">Updated · {latestRoleMonth}</span></span>
      </div>

      <div className="careers-role-grid">
        {activeRoles.map((role, index) => (
          <details className="career-role-card" key={role.id}>
            <summary>
              <span className="career-role-index">0{index + 1}</span>
              <span className="career-role-summary">
                <span className="career-role-meta"><Localized text={role.team} /><i aria-hidden="true">·</i><Localized text={role.location} /></span>
                <strong><Localized text={role.title} /></strong>
                <span className="career-role-blurb"><Localized text={role.summary} /></span>
              </span>
              <span className="career-role-arrow" aria-hidden="true">↘</span>
            </summary>

            <div className="career-role-detail">
              <div className="career-role-detail-intro">
                <span className="career-role-status"><Localized text={role.type} /></span>
                <span className="career-role-date"><span data-lang="zh">发布于 {role.postedAt.replaceAll("-", ".")}</span><span data-lang="en">Posted {role.postedAt.replaceAll("-", ".")}</span></span>
              </div>
              <div className="career-role-columns">
                <div>
                  <h3><span data-lang="zh">你会做什么</span><span data-lang="en">What you will do</span></h3>
                  <RoleList items={role.responsibilities} emptyLabel={{ zh: "内容即将更新。", en: "Details coming soon." }} />
                </div>
                <div>
                  <h3><span data-lang="zh">我们希望你</span><span data-lang="en">What we are looking for</span></h3>
                  <RoleList items={role.requirements} emptyLabel={{ zh: "内容即将更新。", en: "Details coming soon." }} />
                </div>
                <div>
                  <h3><span data-lang="zh">如果你还带来这些</span><span data-lang="en">It is a plus if you</span></h3>
                  <RoleList items={role.niceToHave} emptyLabel={{ zh: "不设额外门槛。", en: "No extra requirements." }} />
                </div>
              </div>
              <div className="career-role-benefits">
                <h3><span data-lang="zh">工作方式与福利</span><span data-lang="en">Working here</span></h3>
                <RoleList items={role.benefits} emptyLabel={{ zh: "面试时详细沟通。", en: "We can talk through the details." }} />
              </div>
              <div className="career-role-footer">
                <div className="career-role-tags">
                  {role.tags.map((tag) => <span key={tag.en}><Localized text={tag} /></span>)}
                </div>
                <a className="career-apply-link" href={applicationUrl} target="_blank" rel="noreferrer">
                  <span data-lang="zh">投递这个职位</span><span data-lang="en">Apply for this role</span><span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
