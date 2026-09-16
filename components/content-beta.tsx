import { OyscatCompanion } from "./oyscat-companion";
import { OyscatBetaScene } from "./oyscat-beta-scene";
import styles from "@/app/(qicore)/oyscat/oyscat.module.css";
import { BilingualText as Bi } from "@/components/marketing-page";

export function ContentBeta() {
  return (
    <section className={`marketing-section ${styles.beta}`} id="beta" aria-labelledby="beta-title">
      <div className={styles.betaCopy} data-qicore-waterfall="6">
        <p className="section-kicker">07 / CLOSED BETA</p>
        <h2 id="beta-title"><Bi zh="Oyscat Beta 内测开启" en="Oyscat beta is now open" /></h2>
        <p><Bi zh="欢迎留下邮箱报名参与。团队筛选后，将为入选用户提供内测账号并通过邮件联系。" en="Leave your email to apply. Our team will select participants, provide beta accounts, and follow up by email." /></p>
      </div>
      <div className={styles.betaAction} data-qicore-waterfall="7">
        <OyscatBetaScene />
        <form className={styles.betaForm} data-oyscat-beta-form>
          <label htmlFor="beta-email"><Bi zh="邮箱地址" en="Email address" /></label>
          <div className={styles.betaEmailSlot}>
            <input id="beta-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder=" " />
            <div className={styles.betaEmailHint} aria-hidden="true">
              <span className={styles.betaMailIcon}>✉</span>
              <div className={styles.betaEmailReel}>
                <div className={styles.betaEmailTrack}>
                  <span><Bi zh="留下你的邮箱" en="Your email address" /></span>
                  <span><Bi zh="领取下一次造物邀请" en="Your next build awaits" /></span>
                  <span><Bi zh="和 Oyscat 一起动手" en="Make something with Oyscat" /></span>
                  <span><Bi zh="留下你的邮箱" en="Your email address" /></span>
                </div>
              </div>
            </div>
          </div>
          <button className={styles.heroBetaButton} type="submit"><OyscatCompanion className={styles.buttonCat} /><Bi zh="申请" en="Apply" /></button>
          <p className={styles.betaStatus} data-beta-status role="status" aria-live="polite" hidden>
            <span data-lang="zh">感谢您的报名，我们将尽快与您联系。</span>
            <span data-lang="en">Thanks for signing up. We&apos;ll reach out to you soon.</span>
          </p>
        </form>
      </div>
    </section>
  );
}
