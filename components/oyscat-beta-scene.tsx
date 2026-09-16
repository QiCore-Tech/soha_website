import styles from "./oyscat-beta-scene.module.css";

export function OyscatBetaScene() {
  return <div className={styles.scene} aria-hidden="true">
    <div className={styles.caption}><span>OYSCAT / MAKE SOMETHING</span><span className={styles.idle}><span data-lang="zh">下一位造物搭子，是你吗？</span><span data-lang="en">Your next build starts here.</span></span><span className={styles.writing}><span data-lang="zh">猫猫准备好接收了</span><span data-lang="en">Ready when you are.</span></span><span className={styles.sending}><span data-lang="zh">正在递交申请…</span><span data-lang="en">Sending your application…</span></span><span className={styles.done}><span data-lang="zh">收到啦，期待一起造物！</span><span data-lang="en">Received. Let’s make something!</span></span></div>
    <svg viewBox="0 0 420 176" focusable="false">
      <ellipse cx="216" cy="151" rx="173" ry="9" fill="#292521" opacity=".045" />
      <path d="M32 144h356" stroke="#292521" strokeOpacity=".14" />
      <g className={styles.orbit}><path d="M72 28h8v8h8v8h-8v8h-8v-8h-8v-8h8Z" fill="#a6dd3f"/><path d="M198 22h6v6h6v6h-6v6h-6v-6h-6v-6h6Z" fill="#91a99a"/></g>
      <g transform="translate(274 48)" shapeRendering="crispEdges">
        <path d="M0 22 20 0h66l20 22v74H0Z" fill="#292c25" />
        <path d="M6 26h94v64H6Z" fill="#bbc7b4" />
        <path d="M6 26h94v22H6Z" fill="#a6dd3f" />
        <path d="M20 32h64v10H20Z" fill="#292c25" />
        <path d="M40 60h6v-8h6v8h14v-8h6v8h6v16H40Z" fill="#292c25" />
        <path d="M48 65h4v5h-4zm18 0h4v5h-4Z" fill="#a6dd3f" />
        <path d="M12 96h16v6H12zm64 0h16v6H76Z" fill="#292c25" />
      </g>
      <g className={styles.cat} shapeRendering="crispEdges">
        <path className={styles.tail} d="M86 119H66v-8H54V88h8v17h12v6h16Z" fill="#242820" />
        <path d="M84 104h64v30H84Z" fill="#242820" />
        <path d="M122 74V54h8l12 14h20l12-14h8v20h8v42h-8v8h-52v-8h-8Z" fill="#242820" />
        <path d="M136 88h6v10h-6zm32 0h6v10h-6Z" fill="#b2ef48" />
        <path d="M151 103h8v4h-8Z" fill="#91a99a" />
        <path className={styles.paw} d="M92 132h12v12H88v-6h4zm42 0h12v12h-16v-6h4Z" fill="#242820" />
        <path d="M118 99h12v3h-12zm58 0h14v3h-14Z" fill="#a6dd3f" />
      </g>
      <g className={styles.letter}>
        <rect x="174" y="94" width="44" height="30" rx="2" fill="#f2f4eb" stroke="#292c25" strokeWidth="2" />
        <path d="m175 97 21 15 21-15" fill="none" stroke="#292c25" strokeWidth="2" />
        <path d="M193 107h6v6h-6Z" fill="#a6dd3f" />
      </g>
      <g className={styles.spark} fill="#a6dd3f"><path d="M254 38h4v8h-4zm-12 12h8v4h-8zm18-18h4v8h-4Z"/></g>
      <g className={styles.check}><circle cx="326" cy="48" r="18" fill="#a6dd3f"/><path d="m317 48 6 6 12-13" fill="none" stroke="#242820" strokeWidth="3"/></g>
    </svg>
  </div>;
}
