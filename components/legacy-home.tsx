import { readFileSync } from "node:fs";
import path from "node:path";

const legacyScript = readFileSync(path.join(process.cwd(), "public/legacy-home.js"), "utf8");

export function LegacyHome() {
  return (
    <>
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
                    <span className="brand">气核科技（qicore）</span> 专注于智能硬件创造与新一代平台研发，欢迎了解公司业务，
                    <span className="hiring">WE ARE HIRING</span>。
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

      <div className="palette-overlay" id="palette-overlay" aria-hidden="true">
        <div className="palette-backdrop" id="palette-backdrop" />
      </div>

      <div id="cursor-wrapper">
        <div className="cursor-dot" />
        <div className="cursor-cube-container" id="cursor-cube" role="menu" aria-label="Voxel color palette">
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
      </div>

      <script dangerouslySetInnerHTML={{ __html: legacyScript }} />
    </>
  );
}
