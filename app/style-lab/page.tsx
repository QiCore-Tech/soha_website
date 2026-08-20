import styles from "./style-lab.module.css";

const directions = [
  { id: "styleEditorial", className: "editorialChoice", label: "A 编辑部目录", note: "清晰、有秩序、像一本当代设计杂志" },
  { id: "styleArchive", className: "archiveChoice", label: "B 安静档案馆", note: "低调、理性，以内容索引代替视觉口号" },
  { id: "styleAtelier", className: "atelierChoice", label: "C 人文工作室", note: "温和、留白，突出创造者与长期主义" },
  { id: "styleJournal", className: "journalChoice", label: "D 工程手记", note: "图纸、注释与实验记录组成的轻技术感" }
] as const;

export default function StyleLabPage() {
  return (
    <main className={styles.styleLab}>
      <input className={`${styles.styleToggle} ${styles.editorialToggle}`} defaultChecked id="styleEditorial" name="styleDirection" type="radio" />
      <input className={`${styles.styleToggle} ${styles.archiveToggle}`} id="styleArchive" name="styleDirection" type="radio" />
      <input className={`${styles.styleToggle} ${styles.atelierToggle}`} id="styleAtelier" name="styleDirection" type="radio" />
      <input className={`${styles.styleToggle} ${styles.journalToggle}`} id="styleJournal" name="styleDirection" type="radio" />
      <div className={styles.labBar}>
        <div>
          <strong>QiCore Style Lab</strong>
          <span>仅用于风格选择，不影响正式页面</span>
        </div>
        <div className={styles.labChoices}>
          {directions.map((item) => (
            <label className={styles[item.className]} htmlFor={item.id} key={item.id}>
              {item.label}
            </label>
          ))}
        </div>
        <a href="/">返回官网</a>
      </div>

      <div className={styles.directionNotes}>
        {directions.map((item) => <p className={styles[item.className]} key={item.id}>{item.note}</p>)}
      </div>

      <div className={styles.panels}>
        <EditorialDemo />
        <ArchiveDemo />
        <AtelierDemo />
        <JournalDemo />
      </div>
    </main>
  );
}

function EditorialDemo() {
  return (
    <section className={`${styles.demo} ${styles.editorial}`}>
      <header className={styles.editorialHeader}>
        <span>QiCore / 气核科技</span>
        <nav><span>公司</span><span>动态</span><span>团队</span><span>OysCat ↗</span></nav>
        <span>中文 · EN</span>
      </header>
      <div className={styles.editorialLayout}>
        <aside><span>01</span><b>创造</b><span>02</span><b>工程</b><span>03</span><b>产品</b></aside>
        <div className={styles.editorialMain}>
          <small>INTELLIGENT HARDWARE, MADE HUMAN</small>
          <h1>把复杂的技术，<br />变成自然的创造。</h1>
          <div className={styles.editorialIntro}>
            <p>QiCore 将设计、工程与制造放在同一条创造路径上，让智能硬件更容易从想法走向现实。</p>
            <a>了解 QiCore →</a>
          </div>
        </div>
        <div className={styles.objectStudy}>
          <span className={styles.salmonBlock} />
          <span className={styles.sageBlock} />
          <span className={styles.sandBlock} />
          <small>OBJECT STUDY / 001</small>
        </div>
      </div>
    </section>
  );
}

function ArchiveDemo() {
  return (
    <section className={`${styles.demo} ${styles.archive}`}>
      <header className={styles.archiveHeader}>
        <span>QICORE</span>
        <nav><span>ABOUT</span><span>NEWS</span><span>PEOPLE</span></nav>
        <span>OYSCAT ↗</span>
      </header>
      <div className={styles.archiveIntro}>
        <div><small>Q/CORE — 2026</small><small>杭州 · 深圳</small></div>
        <h1>智能硬件创造公司</h1>
        <p>研究新的工具、产品与协作方式。<br />从完整系统出发，而不是孤立的技术环节。</p>
      </div>
      <div className={styles.archiveRows}>
        <ArchiveRow index="01" title="产品与体验" text="把复杂技术组织成清晰、自然的产品体验。" />
        <ArchiveRow index="02" title="软硬件工程" text="电子、结构、嵌入式与软件在同一路径协同。" />
        <ArchiveRow index="03" title="验证与制造" text="连接原型、验证与制造，持续推进真实交付。" />
      </div>
    </section>
  );
}

function ArchiveRow({ index, title, text }: { index: string; title: string; text: string }) {
  return <article><span>{index}</span><h2>{title}</h2><p>{text}</p><b>↗</b></article>;
}

function AtelierDemo() {
  return (
    <section className={`${styles.demo} ${styles.atelier}`}>
      <header className={styles.atelierHeader}>
        <span>QiCore</span>
        <nav><span>我们是谁</span><span>正在创造</span><span>加入我们</span></nav>
        <span>OysCat ↗</span>
      </header>
      <div className={styles.atelierBody}>
        <small>气核科技 · QICORE TECHNOLOGY</small>
        <h1>我们相信，好的技术<br />应该让人更自由地创造。</h1>
        <p>我们是一群设计师、工程师和制造者。我们从人的感受出发，研究智能硬件如何被更自然地想象、构建与使用。</p>
        <div className={styles.atelierDivider}><span /><i /><span /></div>
        <footer><span>从想法到真实产品</span><a>阅读我们的故事 →</a><span>Make Smart · 气造万物</span></footer>
      </div>
    </section>
  );
}

function JournalDemo() {
  return (
    <section className={`${styles.demo} ${styles.journal}`}>
      <header className={styles.journalHeader}>
        <span>QI / CORE</span>
        <nav><span>INDEX</span><span>STORIES</span><span>TEAM</span></nav>
        <span>PRODUCT 01 ↗</span>
      </header>
      <div className={styles.journalGrid}>
        <div className={styles.journalTitle}>
          <small>NOTE 024 / CREATION SYSTEMS</small>
          <h1>创造一件真正工作的东西。</h1>
          <p>设计不是表面，工程也不是终点。我们关心的是一个想法如何穿过所有边界，最终成为人们愿意使用的产品。</p>
        </div>
        <div className={styles.journalSketch}>
          <span className={styles.sketchCircle} />
          <span className={styles.sketchAxisX} />
          <span className={styles.sketchAxisY} />
          <span className={styles.sketchCube} />
          <small>PROTOTYPE FIELD / SCALE 1:4</small>
        </div>
        <div className={styles.journalNotes}>
          <article><span>01</span><p>从人的使用感受开始。</p></article>
          <article><span>02</span><p>让软硬件在同一张桌上工作。</p></article>
          <article><span>03</span><p>用真实原型代替抽象争论。</p></article>
        </div>
      </div>
    </section>
  );
}
