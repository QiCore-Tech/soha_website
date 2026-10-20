
import { messages } from "@/i18n/messages";
import { BilingualText as Bi } from "@/components/marketing-page";
import type { LocalizedText } from "@/types/locale";
import styles from "./style-lab.module.css";

const directions = [
  { id: "styleEditorial", className: "editorialChoice", label: messages.styleLab.aEditorial, note: messages.styleLab.clearAndStructuredLikeAContemporaryDesignJournal },
  { id: "styleArchive", className: "archiveChoice", label: messages.styleLab.bQuietArchive, note: messages.styleLab.understatedAndRationalOrganizedAroundAContentIndex },
  { id: "styleAtelier", className: "atelierChoice", label: messages.styleLab.cHumanAtelier, note: messages.styleLab.gentleAndSpaciousFocusedOnCreatorsAndLasting },
  { id: "styleJournal", className: "journalChoice", label: messages.styleLab.dEngineeringJournal, note: messages.styleLab.aLightTechnicalFeelThroughDrawingsNotesAnd }
] as const;

export default function StyleLabPage() {
  return (
    <main data-style-lab className={styles.styleLab}>
      <input className={`${styles.styleToggle} ${styles.editorialToggle}`} defaultChecked id="styleEditorial" name="styleDirection" type="radio" />
      <input className={`${styles.styleToggle} ${styles.archiveToggle}`} id="styleArchive" name="styleDirection" type="radio" />
      <input className={`${styles.styleToggle} ${styles.atelierToggle}`} id="styleAtelier" name="styleDirection" type="radio" />
      <input className={`${styles.styleToggle} ${styles.journalToggle}`} id="styleJournal" name="styleDirection" type="radio" />
      <div className={styles.labBar}>
        <div>
          <strong><span data-lang="zh">{messages.styleLab.qicoreStyleLab.zh}</span><span data-lang="en">{messages.styleLab.qicoreStyleLab.en}</span></strong>
          <span><span data-lang="zh">{messages.styleLab.styleExplorationOnlyTheMainWebsiteIsUnchanged.zh}</span><span data-lang="en">{messages.styleLab.styleExplorationOnlyTheMainWebsiteIsUnchanged.en}</span></span>
        </div>
        <div className={styles.labChoices}>
          {directions.map((item) => (
            <label className={styles[item.className]} htmlFor={item.id} key={item.id}>
              <Bi {...item.label} />
            </label>
          ))}
        </div>
        <a href="/"><span data-lang="zh">{messages.styleLab.backToTheWebsite.zh}</span><span data-lang="en">{messages.styleLab.backToTheWebsite.en}</span></a>
      </div>

      <div className={styles.directionNotes}>
        {directions.map((item) => <p className={styles[item.className]} key={item.id}><Bi {...item.note} /></p>)}
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
      <header data-scroll-reveal className={styles.editorialHeader}>
        <span><span data-lang="zh">{messages.styleLab.qicoreTechnology.zh}</span><span data-lang="en">{messages.styleLab.qicoreTechnology.en}</span></span>
        <nav><span><span data-lang="zh">{messages.styleLab.company.zh}</span><span data-lang="en">{messages.styleLab.company.en}</span></span><span><span data-lang="zh">{messages.styleLab.news.zh}</span><span data-lang="en">{messages.styleLab.news.en}</span></span><span><span data-lang="zh">{messages.styleLab.team.zh}</span><span data-lang="en">{messages.styleLab.team.en}</span></span><span>{messages.styleLab.oyscat.zh}</span></nav>
        <span>{messages.styleLab.en.zh}</span>
      </header>
      <div className={styles.editorialLayout}>
        <aside><span>{messages.styleLab.value01.zh}</span><b><span data-lang="zh">{messages.styleLab.creation.zh}</span><span data-lang="en">{messages.styleLab.creation.en}</span></b><span>{messages.styleLab.value02.zh}</span><b><span data-lang="zh">{messages.styleLab.engineering.zh}</span><span data-lang="en">{messages.styleLab.engineering.en}</span></b><span>{messages.styleLab.value03.zh}</span><b><span data-lang="zh">{messages.styleLab.product.zh}</span><span data-lang="en">{messages.styleLab.product.en}</span></b></aside>
        <div className={styles.editorialMain}>
          <small><span data-lang="zh">{messages.styleLab.intelligentHardwareMadeHuman.zh}</span><span data-lang="en">{messages.styleLab.intelligentHardwareMadeHuman.en}</span></small>
          <h1><span data-lang="zh">{messages.styleLab.turnComplexTechnology.zh}</span><span data-lang="en">{messages.styleLab.turnComplexTechnology.en}</span><br /><span data-lang="zh">{messages.styleLab.intoIntuitiveCreation.zh}</span><span data-lang="en">{messages.styleLab.intoIntuitiveCreation.en}</span></h1>
          <div className={styles.editorialIntro}>
            <p><span data-lang="zh">{messages.styleLab.qicoreConnectsDesignEngineeringAndManufacturingSoSmart.zh}</span><span data-lang="en">{messages.styleLab.qicoreConnectsDesignEngineeringAndManufacturingSoSmart.en}</span></p>
            <a><span data-lang="zh">{messages.styleLab.discoverQicore.zh}</span><span data-lang="en">{messages.styleLab.discoverQicore.en}</span></a>
          </div>
        </div>
        <div className={styles.objectStudy}>
          <span className={styles.salmonBlock} />
          <span className={styles.sageBlock} />
          <span className={styles.sandBlock} />
          <small><span data-lang="zh">{messages.styleLab.objectStudy001.zh}</span><span data-lang="en">{messages.styleLab.objectStudy001.en}</span></small>
        </div>
      </div>
    </section>
  );
}

function ArchiveDemo() {
  return (
    <section className={`${styles.demo} ${styles.archive}`}>
      <header data-scroll-reveal className={styles.archiveHeader}>
        <span>{messages.styleLab.qicore.zh}</span>
        <nav><span><span data-lang="zh">{messages.styleLab.about.zh}</span><span data-lang="en">{messages.styleLab.about.en}</span></span><span><span data-lang="zh">{messages.styleLab.news.zh}</span><span data-lang="en">{messages.styleLab.news.en}</span></span><span><span data-lang="zh">{messages.styleLab.people.zh}</span><span data-lang="en">{messages.styleLab.people.en}</span></span></nav>
        <span>{messages.styleLab.oyscat2.zh}</span>
      </header>
      <div className={styles.archiveIntro}>
        <div><small>{messages.styleLab.qCore2026.zh}</small><small><span data-lang="zh">{messages.styleLab.hangzhouShenzhen.zh}</span><span data-lang="en">{messages.styleLab.hangzhouShenzhen.en}</span></small></div>
        <h1><span data-lang="zh">{messages.styleLab.aSmartHardwareCreationCompany.zh}</span><span data-lang="en">{messages.styleLab.aSmartHardwareCreationCompany.en}</span></h1>
        <p><span data-lang="zh">{messages.styleLab.exploringNewToolsProductsAndWaysToCollaborate.zh}</span><span data-lang="en">{messages.styleLab.exploringNewToolsProductsAndWaysToCollaborate.en}</span><br /><span data-lang="zh">{messages.styleLab.startingWithCompleteSystemsNotIsolatedTechnologies.zh}</span><span data-lang="en">{messages.styleLab.startingWithCompleteSystemsNotIsolatedTechnologies.en}</span></p>
      </div>
      <div className={styles.archiveRows}>
        <ArchiveRow index="01" title={messages.styleLab.productExperience} text={messages.styleLab.productExperienceCopy} />
        <ArchiveRow index="02" title={messages.styleLab.hardwareSoftwareEngineering} text={messages.styleLab.engineeringCopy} />
        <ArchiveRow index="03" title={messages.styleLab.validationManufacturing} text={messages.styleLab.manufacturingCopy} />
      </div>
    </section>
  );
}

function ArchiveRow({ index, title, text }: { index: string; title: LocalizedText; text: LocalizedText }) {
  return <article data-scroll-reveal><span>{index}</span><h2><Bi {...title} /></h2><p><Bi {...text} /></p><b>↗</b></article>;
}

function AtelierDemo() {
  return (
    <section className={`${styles.demo} ${styles.atelier}`}>
      <header data-scroll-reveal className={styles.atelierHeader}>
        <span>{messages.styleLab.qicore2.zh}</span>
        <nav><span><span data-lang="zh">{messages.styleLab.whoWeAre.zh}</span><span data-lang="en">{messages.styleLab.whoWeAre.en}</span></span><span><span data-lang="zh">{messages.styleLab.whatWeAreCreating.zh}</span><span data-lang="en">{messages.styleLab.whatWeAreCreating.en}</span></span><span><span data-lang="zh">{messages.styleLab.joinUs.zh}</span><span data-lang="en">{messages.styleLab.joinUs.en}</span></span></nav>
        <span>{messages.styleLab.oyscat.zh}</span>
      </header>
      <div className={styles.atelierBody}>
        <small><span data-lang="zh">{messages.styleLab.qicoreTechnology.zh}</span><span data-lang="en">{messages.styleLab.qicoreTechnology.en}</span></small>
        <h1><span data-lang="zh">{messages.styleLab.weBelieveGoodTechnology.zh}</span><span data-lang="en">{messages.styleLab.weBelieveGoodTechnology.en}</span><br /><span data-lang="zh">{messages.styleLab.shouldGivePeopleMoreFreedomToCreate.zh}</span><span data-lang="en">{messages.styleLab.shouldGivePeopleMoreFreedomToCreate.en}</span></h1>
        <p><span data-lang="zh">{messages.styleLab.weAreDesignersEngineersAndMakersStartingWith.zh}</span><span data-lang="en">{messages.styleLab.weAreDesignersEngineersAndMakersStartingWith.en}</span></p>
        <div className={styles.atelierDivider}><span /><i /><span /></div>
        <footer><span><span data-lang="zh">{messages.styleLab.fromIdeaToRealProduct.zh}</span><span data-lang="en">{messages.styleLab.fromIdeaToRealProduct.en}</span></span><a><span data-lang="zh">{messages.styleLab.readOurStory.zh}</span><span data-lang="en">{messages.styleLab.readOurStory.en}</span></a><span><span data-lang="zh">{messages.styleLab.makeSmart.zh}</span><span data-lang="en">{messages.styleLab.makeSmart.en}</span></span></footer>
      </div>
    </section>
  );
}

function JournalDemo() {
  return (
    <section className={`${styles.demo} ${styles.journal}`}>
      <header data-scroll-reveal className={styles.journalHeader}>
        <span>{messages.styleLab.qiCore.zh}</span>
        <nav><span><span data-lang="zh">{messages.styleLab.index.zh}</span><span data-lang="en">{messages.styleLab.index.en}</span></span><span><span data-lang="zh">{messages.styleLab.stories.zh}</span><span data-lang="en">{messages.styleLab.stories.en}</span></span><span><span data-lang="zh">{messages.styleLab.team.zh}</span><span data-lang="en">{messages.styleLab.team.en}</span></span></nav>
        <span><span data-lang="zh">{messages.styleLab.product01.zh}</span><span data-lang="en">{messages.styleLab.product01.en}</span></span>
      </header>
      <div className={styles.journalGrid}>
        <div className={styles.journalTitle}>
          <small><span data-lang="zh">{messages.styleLab.note024CreationSystems.zh}</span><span data-lang="en">{messages.styleLab.note024CreationSystems.en}</span></small>
          <h1><span data-lang="zh">{messages.styleLab.createSomethingThatReallyWorks.zh}</span><span data-lang="en">{messages.styleLab.createSomethingThatReallyWorks.en}</span></h1>
          <p><span data-lang="zh">{messages.styleLab.designIsMoreThanAppearanceAndEngineeringIs.zh}</span><span data-lang="en">{messages.styleLab.designIsMoreThanAppearanceAndEngineeringIs.en}</span></p>
        </div>
        <div className={styles.journalSketch}>
          <span className={styles.sketchCircle} />
          <span className={styles.sketchAxisX} />
          <span className={styles.sketchAxisY} />
          <span className={styles.sketchCube} />
          <small><span data-lang="zh">{messages.styleLab.prototypeFieldScale14.zh}</span><span data-lang="en">{messages.styleLab.prototypeFieldScale14.en}</span></small>
        </div>
        <div data-scroll-reveal className={styles.journalNotes}>
          <article><span>{messages.styleLab.value01.zh}</span><p><span data-lang="zh">{messages.styleLab.startWithPeopleSExperience.zh}</span><span data-lang="en">{messages.styleLab.startWithPeopleSExperience.en}</span></p></article>
          <article><span>{messages.styleLab.value02.zh}</span><p><span data-lang="zh">{messages.styleLab.bringHardwareAndSoftwareToTheSameTable.zh}</span><span data-lang="en">{messages.styleLab.bringHardwareAndSoftwareToTheSameTable.en}</span></p></article>
          <article><span>{messages.styleLab.value03.zh}</span><p><span data-lang="zh">{messages.styleLab.replaceAbstractDebateWithRealPrototypes.zh}</span><span data-lang="en">{messages.styleLab.replaceAbstractDebateWithRealPrototypes.en}</span></p></article>
        </div>
      </div>
    </section>
  );
}
