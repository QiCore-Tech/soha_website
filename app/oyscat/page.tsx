import type { Metadata } from "next";
import { BilingualText } from "@/components/marketing-page";
import { OysCatHeroAnimation } from "@/components/oyscat-hero-animation";
import { OysCatNav } from "@/components/oyscat-nav";

export const metadata: Metadata = {
  title: "OysCat 产品",
  description: "OysCat 产品介绍、Workspace 与电子模块。"
};

export default function OysCatPage() {
  return (
    <main className="oyscat-product-page">
      <OysCatNav />

      <section className="oyscat-product-hero" id="overview">
        <div className="oyscat-product-copy">
          <img className="oyscat-product-wordmark" src="/brand/oyscat-wordmark.png" alt="OysCat" />
          <p className="oyscat-product-kicker">QiCore Product 01</p>
          <h1>
            <BilingualText
              zh={<>游戏化创造，<br />迈出第一步。</>}
              en={<>Gamified Creation.<br />Our First Step.</>}
            />
          </h1>
          <p className="oyscat-product-intro">
            <BilingualText
              zh="OysCat 是 QiCore 推出的首款造物系统，面向创客、硬件开发者，以及所有想要探索全新创造方式的人群。"
              en="OysCat is QiCore's first product family, built for makers, hardware creators, and DIY enthusiasts."
            />
          </p>
          <div className="oyscat-product-actions">
            <a href="#products" className="oyscat-solid-cta"><BilingualText zh="查看产品" en="Explore products" /></a>
            <a href="https://beta-hk.oyscat.com/" className="oyscat-line-cta">
              <BilingualText zh="进入 Workspace" en="Open Workspace" /><span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="oyscat-product-visual" aria-hidden="true">
          <span className="product-visual-label label-top">FIG. 01 / OYSCAT IDENTITY</span>
          <span className="product-visual-label label-side">QICORE PRODUCT RECORD · 2026</span>
          <span className="product-visual-disc" />
          <span className="product-visual-orbit orbit-one" />
          <span className="product-visual-orbit orbit-two" />
          <OysCatHeroAnimation />
        </div>
      </section>

      <section className="oyscat-positioning-note" aria-label="OysCat product positioning">
        <div className="oyscat-positioning-heading">
          <p className="section-kicker">Why OysCat</p>
          <h2><BilingualText zh="让想法从屏幕走进现实。" en="From the screen into the physical world." /></h2>
        </div>
        <div className="oyscat-positioning-copy">
          <p><BilingualText zh="如果你玩过 Minecraft 等建造类游戏，对 OysCat 的操作模式会很有熟悉感。不一样的是，游戏里搭建的内容只存在于屏幕中，而 OysCat 能让你的设计从虚拟走进现实，变成真正可以运行的物品。" en="If you've played Minecraft, you already know how to use OysCat. The difference is this: what you build on screen can be made into real objects that work, move, and respond." /></p>
          <p><BilingualText zh="你可以快速制作原型，在投入实体制作前先验证想法。设计、仿真、制造，在同一条创作流程中完成。" en="You can prototype fast, and validate an idea before you commit to it. Design, simulate, build are all in one pass, no iterative back-and-forth." /></p>
        </div>
      </section>

      <section className="oyscat-workspace-gallery" id="workspace-works" aria-labelledby="workspace-gallery-title">
        <header className="oyscat-workspace-gallery-heading">
          <p className="section-kicker">Workspace / Case studies</p>
          <div>
            <h2 id="workspace-gallery-title">
              <BilingualText zh="从画布，到作品。" en="From canvas to creation." />
            </h2>
            <p>
              <BilingualText
                zh="从机械臂到游戏控制台，作品先在 Workspace 里成形，再走向真实世界。"
                en="From robotic arms to game consoles, ideas take shape in Workspace before they become real."
              />
            </p>
          </div>
        </header>

        <div className="oyscat-workspace-gallery-grid">
          <figure className="oyscat-workspace-gallery-featured">
            <div className="oyscat-workspace-gallery-image">
              <img
                src="/media/oyscat-workspace/motion-study-main.webp"
                alt="A dual-arm motion study assembled from modular joints in OysCat Workspace"
                loading="lazy"
                decoding="async"
              />
              <span className="oyscat-workspace-gallery-mark">MOTION STUDY / 01</span>
            </div>
            <figcaption>
              <strong><BilingualText zh="双机械臂运动研究" en="Dual-arm Motion Study" /></strong>
              <span><BilingualText zh="关节模块 · 姿态组合 · 行为仿真" en="Joint modules · pose studies · behavior simulation" /></span>
            </figcaption>
          </figure>

          <div className="oyscat-workspace-gallery-stack">
            <figure>
              <div className="oyscat-workspace-gallery-image">
                <img
                  src="/media/oyscat-workspace/voxel-rover-crop.webp"
                  alt="A modular game console assembled in OysCat Workspace"
                  loading="lazy"
                  decoding="async"
                />
                <span className="oyscat-workspace-gallery-mark">INTERACTION STUDY / 02</span>
              </div>
              <figcaption>
                <strong><BilingualText zh="模块化游戏控制台" en="Modular Game Console" /></strong>
                <span><BilingualText zh="摇杆控制 · 状态显示 · 体素结构" en="Joystick control · status display · voxel structure" /></span>
              </figcaption>
            </figure>

            <figure>
              <div className="oyscat-workspace-gallery-image">
                <img
                  src="/media/oyscat-workspace/voxel-vehicle-crop.webp"
                  alt="A modular vehicle assembled from voxel blocks in OysCat Workspace"
                  loading="lazy"
                  decoding="async"
                />
                <span className="oyscat-workspace-gallery-mark">STRUCTURE STUDY / 03</span>
              </div>
              <figcaption>
                <strong><BilingualText zh="模块化车体" en="Modular Vehicle" /></strong>
                <span><BilingualText zh="可扩展的体素结构" en="An expandable voxel structure" /></span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="oyscat-system-section" id="products" aria-label="OysCat creation system">
        <div className="oyscat-system-heading">
          <p>Two core layers</p>
          <h2>
            <BilingualText
              zh="从一句意图，到一个真实工作的物体。"
              en="From intent to a real, working object."
            />
          </h2>
        </div>

        <div className="oyscat-system-grid">
          <article className="oyscat-system-card is-workspace">
            <span className="oyscat-system-index">01 / INTELLIGENCE</span>
            <div className="oyscat-system-card-copy">
              <p className="oyscat-system-role">
                <BilingualText zh="OysCat 工作台" en="OysCat Workspace" />
              </p>
              <h3>Workspace</h3>
              <div className="oyscat-system-keywords" aria-label="Workspace capabilities">
                <span><BilingualText zh="建模" en="MODEL" /></span>
                <span><BilingualText zh="编程" en="CODE" /></span>
                <span><BilingualText zh="仿真" en="SIMULATE" /></span>
                <span><BilingualText zh="控制" en="CONTROL" /></span>
              </div>
              <p>
                <BilingualText
                  zh="从外观结构到功能实现，全流程创作都可在同一个工作台内完成。"
                  en="This is where you build structure and electronics, together, on one canvas."
                />
              </p>
              <p className="oyscat-system-detail"><BilingualText zh="系统内所有部件均以标准化模块呈现，你可以像搭积木一样自由拼接。" en="Design by stacking voxels: cubes, panels, cylinders, etc." /></p>
              <p className="oyscat-system-detail"><BilingualText zh="直接定义作品要实现的效果，AI 会自动生成对应代码。" en={'Simply tell it what it should do: "aim at the red balloon and shoot." The AI writes the code for you, and imbues your design with the intended behaviors.'} /></p>
              <p className="oyscat-system-detail"><BilingualText zh="Workspace 支持实时仿真，验证通过后再进入实体组装。" en="The Workspace runs real-time simulation. This is your final checkpoint, bridging the virtual and physical worlds. What follows is physical." /></p>
              <a href="https://beta-hk.oyscat.com/" className="oyscat-system-link">
                <BilingualText zh="进入 Workspace" en="Open Workspace" /><span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="oyscat-workspace-diagram" aria-hidden="true">
              <span className="workspace-node node-intent">INTENT</span>
              <span className="workspace-node node-model">3D</span>
              <span className="workspace-node node-code">CODE</span>
              <span className="workspace-node node-real">REAL</span>
              <i /><i /><i />
            </div>
          </article>

          <article className="oyscat-system-card is-hardware">
            <span className="oyscat-system-index">02 / PHYSICAL</span>
            <div className="oyscat-system-card-copy">
              <p className="oyscat-system-role">
                <BilingualText zh="OysCat 电子模块" en="OysCat E-Modules" />
              </p>
              <h3>Electronic Modules</h3>
              <div className="oyscat-system-keywords" aria-label="Electronic module capabilities">
                <span><BilingualText zh="运动" en="MOVE" /></span>
                <span><BilingualText zh="灯光" en="LIGHT" /></span>
                <span><BilingualText zh="传感" en="SENSE" /></span>
                <span><BilingualText zh="控制" en="CONTROL" /></span>
              </div>
              <p>
                <BilingualText
                  zh="工作台中的每一个功能模块，都对应一款真实的实体模块。"
                  en="Every electronics module you place in Workspace maps to a physical one."
                />
              </p>
              <p className="oyscat-system-detail"><BilingualText zh="它在现实中的表现，与仿真结果保持一致。" en="Its real-world performance exactly matches your simulation." /></p>
              <p className="oyscat-system-detail"><BilingualText zh="运动、显示、感知、声音、控制……不同功能对应不同的标准模块。" en="These are standardized hardware blocks, designed by function: motion, lighting, sensing, sound, control. Snap them together." /></p>
              <p className="oyscat-system-detail"><BilingualText zh="无需焊接、布线或手动搭建电路，把模块拼接起来，作品就能运行。" en="No soldering, no wiring, no circuits to build by hand. Snap them together, and your creation is complete." /></p>
            </div>
            <div className="oyscat-module-diagram" aria-hidden="true">
              <span /><span /><span /><span />
              <i>MOVE</i><i>LIGHT</i><i>SENSE</i><i>CTRL</i>
            </div>
          </article>
        </div>
        <p className="oyscat-system-conclusion">
          <BilingualText zh="你只需要描述你想要什么。" en="You only need to describe what you want." />
        </p>
      </section>

      <section className="oyscat-product-conclusion">
        <p className="section-kicker">The road ahead</p>
        <h2><BilingualText zh="OysCat 只是开始。" en="OysCat is just the beginning." /></h2>
        <p><BilingualText zh="它是 QiCore 迈向更大愿景的第一步：说出想要什么，让它真正被做出来。" en={"It's the first step on our roadmap toward the full promise: prompt it, and it's made."} /></p>
      </section>

      <footer className="oyscat-product-footer">
        <img src="/brand/oyscat-wordmark.png" alt="OysCat" />
        <p><BilingualText zh="QiCore 的首个产品体系。" en="The first product family by QiCore." /></p>
        <a href="/" data-qicore-return>qicore.ai ↗</a>
      </footer>
    </main>
  );
}
