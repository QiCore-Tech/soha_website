
import { messages } from "@/i18n/messages";
import Script from "next/script";

export function FunHome() {
  return (
    <main data-home-page className="voxel-home">
      <div className="transition-overlay" id="transition-overlay" />
      <div className="emp-flash" id="emp-flash" />

      <div className="voxel-home-stage">
        <div className="ambient-glow" id="ambient-glow" />

        <div className="paper-canvas" id="canvas-area">
          <div id="grid-plane">
            <div className="axis-h" id="axis-h" />
            <div className="axis-v" id="axis-v" />
            <div className="coord-tracker" id="coord-tracker">
              {messages.legacyHome.x0Y0Z0.zh}</div>
          </div>

          <div id="voxels-container" />
          <div id="magnetic-container" />
          <div id="preview-container" />
          <div className="projection-layer" id="projection-layer">
            <div className="projection-shadow projection-title" id="title-shadow">
              <span className="qi">{messages.legacyHome.qi.zh}</span>
              <span className="core">{messages.legacyHome.core.zh}</span>
            </div>
            <div className="projection-shadow projection-slogan" id="slogan-shadow">
              <p>
                {messages.legacyHome.makeSmart.zh}<span className="slogan-separator" /> <span data-lang="zh">{messages.legacyHome.createAnything.zh}</span><span data-lang="en">{messages.legacyHome.createAnything.en}</span></p>
              <span className="slogan-action-separator" aria-hidden="true" />
              <span className="projection-careers-link" aria-hidden="true">
                <span data-lang="zh">{messages.legacyHome.joinUs.zh}</span>
                <span data-lang="en">{messages.legacyHome.joinUs.en}</span>
                <span>→</span>
              </span>
            </div>
          </div>

          <div className="content-layer">
            <h1 className="brand-title" id="plx-title">
              <span className="qi">{messages.legacyHome.qi.zh}</span>
              <span className="core">{messages.legacyHome.core.zh}</span>
            </h1>
            <div className="slogan-shell">
              <div className="slogan-card">
                <div className="slogan-bar" id="plx-slogan">
                  <p>
                    {messages.legacyHome.makeSmart.zh}<span className="slogan-separator" /> <span data-lang="zh">{messages.legacyHome.createAnything.zh}</span><span data-lang="en">{messages.legacyHome.createAnything.en}</span></p>
                  <span className="slogan-action-separator" aria-hidden="true" />
                  <a className="slogan-careers-link" href="/careers" aria-label={messages.legacyHome.viewOpenRoles.zh} data-aria-label-zh={messages.legacyHome.viewOpenRoles.zh} data-aria-label-en={messages.legacyHome.viewOpenRoles.en}>
                    <span data-lang="zh">{messages.legacyHome.joinUs.zh}</span>
                    <span data-lang="en">{messages.legacyHome.joinUs.en}</span>
                    <span className="slogan-careers-arrow" aria-hidden="true">→</span>
                  </a>
                </div>
                <div className="slogan-drawer">
                  <div className="slogan-detail">
                    <p className="company-note">
                      <span data-lang="zh">
                        <span className="brand">{messages.legacyHome.qicoreTechnology.zh}</span> {messages.legacyHome.isBuildingToolsForIntentDrivenPhysical.zh}</span>
                      <span data-lang="en">
                        <span className="brand">{messages.legacyHome.qicoreTechnology.en}</span> {messages.legacyHome.isBuildingToolsForIntentDrivenPhysical.en}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <section className="scene-luon" id="scene-luon" aria-hidden="true" inert hidden>
        <button className="return-cmd" id="btn-return" type="button">
          <span data-lang="zh">{messages.legacyHome.backToCanvas.zh}</span>
          <span data-lang="en">{messages.legacyHome.backToCanvas.en}</span>
        </button>

        <div className="macro-environment" id="macro-environment" aria-hidden="true">
          <div className="oyscat-orbit orbit-a" />
          <div className="oyscat-orbit orbit-b" />
          <div className="oyscat-dot-field" />
        </div>

        <div className="tesseract-wrapper" id="tesseract-wrapper" aria-hidden="true">
          <div className="luon-tesseract oyscat-figure" id="luon-tesseract">
            <img
              data-src="/brand/oyscat-workspace-loading-320-12fps.webp"
              alt=""
              decoding="async"
              fetchPriority="low"
            />
          </div>
        </div>

        <div className="luon-text-group" id="luon-text-group">
          <img className="oyscat-wordmark" src="/brand/oyscat-wordmark.png" alt={messages.legacyHome.oyscat.zh} data-alt-zh={messages.legacyHome.oyscat.zh} data-alt-en={messages.legacyHome.oyscat.en} />
          <p className="luon-subtitle" id="luon-typewriter" />
          <h1 className="luon-title">
            <span data-lang="zh">{messages.legacyHome.whereCreationBegins.zh}</span>
            <span data-lang="en">{messages.legacyHome.whereCreationBegins.en}</span>
          </h1>
          <p className="luon-slogan">
            <span data-lang="zh">{messages.legacyHome.theEndToEndWorkspaceForMakers.zh}</span>
            <span data-lang="en">{messages.legacyHome.theEndToEndWorkspaceForMakers.en}</span>
          </p>

        </div>
      </section>

      <div className="palette-overlay" id="palette-overlay" aria-hidden="true">
        <div className="palette-backdrop" id="palette-backdrop" />
      </div>

      <div id="cursor-wrapper">
        <div className="cursor-dot" />
        <div className="shockwave" id="shockwave" />
        <div className="cube-wrapper" id="cube-wrapper">
          <div className="cursor-cube-container is-spinning" id="cursor-cube" role="menu" aria-label={messages.legacyHome.voxelColorPalette.zh} data-aria-label-zh={messages.legacyHome.voxelColorPalette.zh} data-aria-label-en={messages.legacyHome.voxelColorPalette.en}>
            <div className="cursor-cube-face face front" data-color-key="front" />
            <div className="cursor-cube-face face back" data-color-key="back" />
            <div className="cursor-cube-face face right" data-color-key="right" />
            <div className="cursor-cube-face face left" data-color-key="left" />
            <div className="cursor-cube-face face top" data-color-key="top" />
            <div className="cursor-cube-face face bottom" data-color-key="bottom" />
            <button className="extra-face multi" type="button" data-color-key="multicolor" aria-label={messages.legacyHome.multicolor.zh} data-aria-label-zh={messages.legacyHome.multicolor.zh} data-aria-label-en={messages.legacyHome.multicolor.en} />
            <button className="extra-face white" type="button" data-color-key="white" aria-label={messages.legacyHome.white.zh} data-aria-label-zh={messages.legacyHome.white.zh} data-aria-label-en={messages.legacyHome.white.en} />
            <button className="extra-face black" type="button" data-color-key="black" aria-label={messages.legacyHome.black.zh} data-aria-label-zh={messages.legacyHome.black.zh} data-aria-label-en={messages.legacyHome.black.en} />
          </div>
          <div className="cursor-piece" id="cursor-piece" aria-hidden="true" />
          <div className="charge-hint" id="charge-hint">
            <div className="charge-text"><span data-lang="zh">{messages.legacyHome.holdToClear.zh}</span><span data-lang="en">{messages.legacyHome.holdToClear.en}</span></div>
            <div className="charge-bar-container">
              <div className="charge-bar" />
            </div>
          </div>
        </div>
      </div>

      <Script id="legacy-fun-home-script" src="/legacy-fun-home.js" strategy="afterInteractive" />
    </main>
  );
}
