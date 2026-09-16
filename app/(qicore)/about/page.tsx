import { BilingualText as Bi, MarketingPage } from "@/components/marketing-page";
import { QiCoreFilm } from "@/components/qicore-film";
import styles from "./about.module.css";

const people = [
  { image: "jake", name: "罗世豪", english: "Jake Luo", role: "创始人 & CEO", roleEn: "Founder & CEO" },
  { image: "wenda", name: "盛文达", english: "Wenda Sheng", role: "联合创始人 & CTO", roleEn: "Co-founder & CTO" },
  { image: "braylen", name: "黄扬", english: "Braylen Huang", role: "联合创始人 & CPO", roleEn: "Co-founder & CPO" },
];

export default function AboutPage() {
  return (
    <MarketingPage
      heroArt="system"
      pageClassName={`about-page ${styles.page}`}
      eyebrow={{ zh: "关于 QiCore", en: "About QiCore" }}
      title={{ zh: "MAKE SMART", en: "MAKE SMART" }}
      intro={{ zh: "气核科技是一家 AI 驱动的智能硬件设计与制造公司。", en: "QiCore Technology is an AI-native company for smart hardware design and manufacturing." }}
    >
      <section className={`marketing-section about-narrative ${styles.company}`} aria-labelledby="company-heading">
        <div className={styles.copy} data-qicore-waterfall="2">
          <p className="section-kicker">01 / ABOUT QICORE</p>
          <h2 id="company-heading"><Bi zh="公司介绍" en="About QiCore" /></h2>
          <p><Bi zh="生成式人工智能的革命性突破，已实现人类意图向数字产物（文本、图像、音频等）的高效生成。然而，从人类意图直达物理实体，依然是一道难以逾越的工程鸿沟。" en="Generative AI can now convert human intent into digital artifacts with remarkable efficiency. However, turning human intent into physical artifacts remains an unsolved engineering challenge." /></p>
          <p className={styles.statement}><Bi zh="气核科技是一家AI驱动的智能硬件设计与制造公司" en="Qicore Technology is an AI-native company for smart hardware design and manufacturing." /></p>
          <p><Bi zh={<>首创<strong>生成式物理具现</strong>概念，致力于将人类的造物意图直接转化为功能性物理实体。</>} en={<>We pioneered the concept of <strong>Generative Physical Instantiation (GenPI)</strong>, turning human intent directly into functional physical artifacts.</>} /></p>
          <p><Bi zh="从助力创客与开发者实现原型的敏捷化构建，到最终赋能大众迈向零门槛的个性化智能造物时代。" en="From enabling makers and developers to prototype hardware innovatively and efficiently, to making personalized smart hardware creation accessible to everyone." /></p>
        </div>
        <figure className={styles.diagram} data-qicore-waterfall="3">
          <svg viewBox="0 0 280 240" role="img" aria-labelledby="genpi-title">
            <title id="genpi-title">GenPI：从造物意图到物理实体 / From intent to physical artifacts</title>
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <path opacity=".15" d="M20 40h240M20 100h240M20 160h240M20 220h240M40 20v200M100 20v200M160 20v200M220 20v200" />
              <rect x="28" y="40" width="104" height="66" rx="2" fill="#eae8ec" />
              <circle cx="48" cy="61" r="5" fill="#d8c47d" strokeOpacity=".5" />
              <path opacity=".55" d="M63 61h48M44 79h53M44 89h36" />
              <path strokeDasharray="3 4" opacity=".55" d="M132 73h39q15 0 15 15v24" />
              <path opacity=".55" d="m181 106 5 6 5-6" />
              <path d="m150 145 41-23 41 23-41 24Z" fill="#d8c47d" strokeOpacity=".55" />
              <path d="m150 145 41 24v48l-41-24Z" fill="#91a99a" strokeOpacity=".55" />
              <path d="m191 169 41-24v48l-41 24Z" fill="#b4bcb6" strokeOpacity=".55" />
              <path opacity=".3" d="M136 222h109" />
            </g>
            <g fill="currentColor" fontFamily="monospace" fontSize="8" letterSpacing="1" opacity=".6"><text x="28" y="28">01 / INTENT</text><text x="149" y="113">02 / PHYSICAL</text></g>
          </svg>
          <figcaption><strong>GenPI</strong><span>GENERATIVE PHYSICAL<br />INSTANTIATION</span></figcaption>
        </figure>
      </section>

      <QiCoreFilm />

      <section className={`marketing-section careers-panel ${styles.direction}`} aria-label="近期聚焦与长期使命">
        <article data-qicore-waterfall="3">
          <p className="section-kicker">02 / <Bi zh="近期聚焦" en="Near-term Focus" /></p>
          <h2><Bi zh="高效敏捷的电气化造物系统" en="A streamlined, high-efficiency creation system that makes electronics projects effortless." /></h2>
        </article>
        <article data-qicore-waterfall="4">
          <p className="section-kicker">03 / <Bi zh="长期使命" en="Long-term Mission" /></p>
          <h2><Bi zh="全范畴的生成式物理造物生态系统" en="A full-spectrum ecosystem for generative physical creation." /></h2>
        </article>
      </section>

      <section className={`marketing-section about-narrative ${styles.team}`} id="team" aria-labelledby="team-heading">
        <header data-qicore-waterfall="4"><p className="section-kicker">04 / OUR TEAM</p><h2 id="team-heading"><Bi zh="核心团队" en="Our team" /></h2></header>
        <div className={styles.people}>
          {people.map(person => <article className={styles.person} key={person.image} data-qicore-waterfall="5">
            <img src={`/media/v3/${person.image}.webp`} alt={`${person.name} / ${person.english}`} loading="lazy" />
            <div className={styles.personText}><h3><Bi zh={person.name} en={person.english} /></h3><p className={styles.englishName} data-lang="zh">{person.english}</p><p className={styles.role}><Bi zh={person.role} en={person.roleEn} /></p></div>
          </article>)}
        </div>
      </section>

      <section className={`marketing-section careers-panel ${styles.join}`}>
        <h2 data-qicore-waterfall="6"><Bi zh="加入我们" en="Join Us" /></h2>
        <a className="company-cta dark" href="/careers" data-qicore-waterfall="7"><Bi zh="查看开放职位" en="View open roles" /><span aria-hidden="true">↗</span></a>
      </section>
    </MarketingPage>
  );
}
