import Script from "next/script";
import { MarketingNav } from "@/components/marketing-nav";

export function LegacyHome() {
  return (
    <>
      <MarketingNav />
      <div className="transition-overlay" id="transition-overlay" />
      <div className="emp-flash" id="emp-flash" />
      <div className="ambient-glow" id="ambient-glow" />

      <div className="paper-canvas" id="canvas-area">
        <div id="grid-plane">
          <div className="axis-h" id="axis-h" />
          <div className="axis-v" id="axis-v" />
          <div className="coord-tracker" id="coord-tracker">
            X: 0 | Y: 0 | Z: 0
          </div>
        </div>

        <div id="voxels-container" />
        <div id="magnetic-container" />
        <div id="preview-container" />
        <div className="projection-layer" id="projection-layer">
          <div className="projection-shadow projection-title" id="title-shadow">
            <span className="qi">Qi</span>
            <span className="core">Core</span>
          </div>
          <div className="projection-shadow projection-slogan" id="slogan-shadow">
            <p>
              Make Smart <span className="slogan-separator" /> 气造万物
            </p>
          </div>
          <div className="projection-shadow projection-footer" id="footer-shadow">
            <div className="icon-indicator" />
            <div className="slot-machine">
              <div className="slot-track" id="footer-shadow-track">
                <span>info</span>
                <span>hr</span>
                <span>info</span>
              </div>
            </div>
            <span className="domain">@qicore.ai</span>
          </div>
        </div>

        <div className="content-layer">
          <h1 className="brand-title" id="plx-title">
            <span className="qi">Qi</span>
            <span className="core">Core</span>
          </h1>
          <div className="slogan-shell">
            <div className="slogan-card">
              <div className="slogan-bar" id="plx-slogan">
                <p>
                  Make Smart <span className="slogan-separator" /> 气造万物
                </p>
              </div>
              <div className="slogan-drawer">
                <div className="slogan-detail">
                  <p className="company-note">
                    <span data-lang="zh">
                      <span className="brand">气核科技（QiCore）</span> 专注于生成式物理造物，致力于让每个人实现「所想即所造」。欢迎了解公司业务，
                      <span className="hiring">WE ARE HIRING</span>。
                    </span>
                    <span data-lang="en">
                      <span className="brand">QiCore Technology</span> is building tools for intent-driven physical creation. Discover our work and grow with us —{" "}
                      <span className="hiring">WE ARE HIRING</span>.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-signature" id="plx-footer">
          <div className="terminal-footer">
            <a className="terminal-footer-link" href="mailto:info@qicore.ai" aria-label="Email info@qicore.ai">
              <div className="icon-indicator" />
              <div className="slot-machine">
                <div className="slot-track" id="footer-slot-track">
                  <span>info</span>
                  <span>hr</span>
                  <span>info</span>
                </div>
              </div>
              <span className="domain">@qicore.ai</span>
            </a>
          </div>
        </div>

      </div>

      <button className="luon-gateway oyscat-gateway" id="btn-trigger" type="button" aria-label="Meet OysCat" data-oyscat-entry>
        <img className="oyscat-gateway-art" src="/brand/oyscat-symbol.svg" alt="" />
        <span className="gateway-copy">
          <small>QiCore Workspace</small>
          <span className="gateway-text">
            <img src="/brand/oyscat-wordmark.png" alt="OysCat" />
          </span>
        </span>
        <span className="gateway-arrow" aria-hidden="true">↗</span>
      </button>

      <section className="scene-luon" id="scene-luon" aria-hidden="true">
        <button className="return-cmd" id="btn-return" type="button">
          <span data-lang="zh">返回创造场</span>
          <span data-lang="en">Back to canvas</span>
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
          <img className="oyscat-wordmark" src="/brand/oyscat-wordmark.png" alt="OysCat" />
          <p className="luon-subtitle" id="luon-typewriter" />
          <h1 className="luon-title">
            <span data-lang="zh">让创造，自然发生。</span>
            <span data-lang="en">Where creation begins.</span>
          </h1>
          <p className="luon-slogan">
            <span data-lang="zh">面向创客与硬件创造者的全链路工作空间</span>
            <span data-lang="en">The end-to-end workspace for makers and hardware creators</span>
          </p>
          <div className="oyscat-scene-actions" data-home-interactive-control>
            <a className="oyscat-primary-action" href="/oyscat">
              <span data-lang="zh">了解 OysCat</span>
              <span data-lang="en">Discover OysCat</span>
            </a>
            <a className="oyscat-secondary-action" href="https://beta-hk.oyscat.com/">
              <span data-lang="zh">进入 Workspace</span>
              <span data-lang="en">Open Workspace</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <div className="palette-overlay" id="palette-overlay" aria-hidden="true">
        <div className="palette-backdrop" id="palette-backdrop" />
      </div>

      <div id="cursor-wrapper">
        <div className="cursor-dot" />
        <div className="shockwave" id="shockwave" />
        <div className="cube-wrapper" id="cube-wrapper">
          <div className="cursor-cube-container is-spinning" id="cursor-cube" role="menu" aria-label="Voxel color palette">
            <div className="cursor-cube-face face front" data-color-key="front" />
            <div className="cursor-cube-face face back" data-color-key="back" />
            <div className="cursor-cube-face face right" data-color-key="right" />
            <div className="cursor-cube-face face left" data-color-key="left" />
            <div className="cursor-cube-face face top" data-color-key="top" />
            <div className="cursor-cube-face face bottom" data-color-key="bottom" />
            <button className="extra-face multi" type="button" data-color-key="multicolor" aria-label="Multicolor" />
            <button className="extra-face white" type="button" data-color-key="white" aria-label="White" />
            <button className="extra-face black" type="button" data-color-key="black" aria-label="Black" />
          </div>
          <div className="charge-hint" id="charge-hint">
            <div className="charge-text">HOLD TO CLEAR</div>
            <div className="charge-bar-container">
              <div className="charge-bar" />
            </div>
          </div>
        </div>
      </div>

      <Script id="legacy-home-script" src="/legacy-home.js" strategy="afterInteractive" />
    </>
  );
}
