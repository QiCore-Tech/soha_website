
import { messages } from "@/i18n/messages";
import type { CSSProperties } from "react";
import styles from "./about-visual.module.css";

export type AboutSceneKind = "assembly" | "genpi" | "join";

const colors = ["#d4d4d4", "#a8a8a8", "#8a8a8a", "#c2c2c2"];

export function AboutVisual({ kind }: { kind: AboutSceneKind }) {
  const isGenpi = kind === "genpi";
  const label = isGenpi ? messages.aboutVisual.intentToPhysicalAria : messages.runtime.assembly;

  return (
    <div className={`${styles.visual} ${styles[kind]}`} data-about-scene={kind} data-assembly-state="assembled">
      <div className={styles.mount} data-about-mount role="img"
        aria-label={label.zh}
        data-aria-label-zh={label.zh}
        data-aria-label-en={label.en}>
        {isGenpi ? <>
          <div className={styles.register} aria-hidden="true">
            <span><span data-lang="zh">{messages.aboutVisual.text01Intent.zh}</span><span data-lang="en">{messages.aboutVisual.text01Intent.en}</span></span>
            <span><span data-lang="zh">{messages.aboutVisual.text02Physical.zh}</span><span data-lang="en">{messages.aboutVisual.text02Physical.en}</span></span>
          </div>

          <div className={styles.intentCard} aria-hidden="true">
            <div className={styles.intentPrompt}>
              <i />
              <span><span data-lang="zh">{messages.aboutVisual.intentPrompt.zh}</span><span data-lang="en">{messages.aboutVisual.intentPrompt.en}</span></span>
            </div>
            <span className={styles.intentRule} />
            <span className={`${styles.intentRule} ${styles.intentRuleShort}`} />
          </div>

          <div className={styles.flowLabel} aria-hidden="true">
            <span className={styles.flowDot} />
            <strong><span data-lang="zh">{messages.aboutVisual.generation.zh}</span><span data-lang="en">{messages.aboutVisual.generation.en}</span></strong>
            <small>{messages.aboutVisual.genpi.zh}</small>
          </div>

          <svg className={styles.genpiArt} viewBox="0 0 480 400" aria-hidden="true" focusable="false">
            <defs>
              <marker id="about-genpi-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 8 4 0 8" fill="none" stroke="#8a8a8a" strokeWidth="1.2" />
              </marker>
            </defs>
            <g className={styles.guides}>
              <path d="M48 64h384M48 124h384M48 184h384M48 244h384M48 304h384M96 42v292M168 42v292M240 42v292M312 42v292M384 42v292" />
            </g>
            <path className={styles.connector} d="M199 138C232 138 242 174 286 195" markerEnd="url(#about-genpi-arrow)" />
            <g className={styles.cube}>
              <ellipse cx="348" cy="338" rx="64" ry="9" fill="#111111" opacity=".07" />
              <path className={styles.cubeTop} d="M348 184 410 222 348 260 286 222Z" />
              <path className={styles.cubeLeft} d="M286 222 348 260v74l-62-38Z" />
              <path className={styles.cubeRight} d="M348 260 410 222v74l-62 38Z" />
              <path className={styles.cubeOutline} d="M348 184 410 222v74l-62 38-62-38v-74ZM348 260v74M286 222l62 38 62-38" />
              <path className={styles.cubeHighlight} d="M316 241 345 258" />
            </g>
          </svg>
        </> : (
          <svg className={styles.fallback} viewBox="0 30 480 400" aria-hidden="true" focusable="false">
            <path d="M48 320h384M80 360l240-240M160 380l240-240M40 240h360" fill="none" stroke="#8a8a8a" opacity=".16" />
            <ellipse cx="245" cy="318" rx="116" ry="14" fill="#111111" opacity=".06" />
            {[0, 1, 2, 3].map((index) => (
              <g key={index} className={styles.block} style={{ "--block-index": index } as CSSProperties}
                transform={`translate(${144 + (index % 2) * 78} ${148 + Math.floor(index / 2) * 68})`}>
                <path d="M0 22 36 0 94 14 58 38Z" fill={colors[index]} stroke="#111111" strokeOpacity=".3" />
                <path d="M0 22 58 38v58L0 80Z" fill={colors[index]} stroke="#111111" strokeOpacity=".3" />
                <path d="m58 38 36-24v58L58 96Z" fill={colors[index]} stroke="#111111" strokeOpacity=".3" />
                <path d="m58 38 36-24v58L58 96Z" fill="#1d2925" opacity=".16" />
                <path d="M12 43 44 52M12 51 32 57" stroke="#fff" opacity=".45" />
              </g>
            ))}
          </svg>
        )}
      </div>
      {isGenpi && <div className={styles.caption}>
        <strong>{messages.aboutVisual.genpi.zh}</strong><span><span data-lang="zh">{messages.aboutVisual.fromIntentToPhysical.zh}</span><span data-lang="en">{messages.aboutVisual.fromIntentToPhysical.en}</span></span>
      </div>}
    </div>
  );
}
