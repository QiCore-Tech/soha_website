import type { Metadata } from "next";
import { BilingualText } from "@/components/marketing-page";
import { OysCatHeroAnimation } from "@/components/oyscat-hero-animation";
import { OysCatNav } from "@/components/oyscat-nav";

export const metadata: Metadata = {
  title: "OysCat 产品",
  description: "OysCat 产品介绍、产品入口与未来产品预告。"
};

export default function OysCatPage() {
  return (
    <main className="oyscat-product-page">
      <OysCatNav />

      <section className="oyscat-product-hero" id="overview">
        <div className="oyscat-product-copy">
          <img className="oyscat-product-wordmark" src="/brand/oyscat-wordmark.png" alt="OysCat" />
          <p className="oyscat-product-kicker">QiCore Product 01</p>
          <h1><BilingualText zh="让创造，自然发生。" en="Where creation begins." /></h1>
          <p className="oyscat-product-intro">
            <BilingualText
              zh="OysCat 是 QiCore 面向智能硬件创造者推出的首个产品体系。这里将汇集当前产品、硬件模块，以及未来的创造工具。"
              en="OysCat is QiCore's first product family for intelligent hardware creators—a home for current products, hardware modules, and the tools still to come."
            />
          </p>
          <div className="oyscat-product-actions">
            <a href="#products" className="oyscat-solid-cta"><BilingualText zh="查看产品" en="Explore products" /></a>
            <a href="https://oyscat.com" className="oyscat-line-cta">
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

      <section className="oyscat-product-principles" aria-label="OysCat product principles">
        <article>
          <span>01</span>
          <h2><BilingualText zh="一体化创造" en="Create as one" /></h2>
          <p><BilingualText zh="从想法、设计到软硬件实现，减少工具之间的断点。" en="Reduce the gaps between ideas, design, software, and hardware." /></p>
        </article>
        <article>
          <span>02</span>
          <h2><BilingualText zh="面向真实产品" en="Built for reality" /></h2>
          <p><BilingualText zh="每个入口都指向可以验证、迭代和交付的真实结果。" en="Every entry point leads toward outcomes that can be tested, iterated, and delivered." /></p>
        </article>
        <article>
          <span>03</span>
          <h2><BilingualText zh="持续生长" en="Designed to grow" /></h2>
          <p><BilingualText zh="产品体系将随新的模块、设备和创造工具持续扩展。" en="The product family will expand with new modules, devices, and creative tools." /></p>
        </article>
      </section>

      <section className="oyscat-product-catalog" id="products">
        <div className="product-section-heading">
          <p>Product entrance</p>
          <h2><BilingualText zh="现在，以及接下来。" en="Now, and what comes next." /></h2>
        </div>

        <article className="featured-product-card">
          <div className="featured-product-copy">
            <small className="featured-record">RECORD / HARDWARE / 001</small>
            <span className="product-status"><BilingualText zh="首款硬件 · 即将发布" en="First hardware · Coming soon" /></span>
            <h3><BilingualText zh="OysCat 智能硬件模块" en="OysCat intelligent hardware module" /></h3>
            <p><BilingualText zh="黑色电子模块的正式产品信息、规格与发布计划将在这里公布。" en="Official product information, specifications, and release plans for the black electronics module will be announced here." /></p>
          </div>
          <div className="module-teaser" aria-hidden="true">
            <span className="module-shell"><i /><i /><i /></span>
            <span className="module-glow" />
            <small>PRODUCT 01 / PREVIEW</small>
          </div>
        </article>

        <div className="future-product-grid" id="future">
          <article>
            <span>02</span>
            <h3><BilingualText zh="下一款产品" en="Next product" /></h3>
            <p><BilingualText zh="入口预留中" en="Reserved for what's next" /></p>
          </article>
          <article>
            <span>03</span>
            <h3><BilingualText zh="未来产品" en="Future product" /></h3>
            <p><BilingualText zh="入口预留中" en="Reserved for what's next" /></p>
          </article>
        </div>
      </section>

      <footer className="oyscat-product-footer">
        <img src="/brand/oyscat-wordmark.png" alt="OysCat" />
        <p><BilingualText zh="QiCore 的首个产品体系。" en="The first product family by QiCore." /></p>
        <a href="/" data-qicore-return>qicore.ai ↗</a>
      </footer>
    </main>
  );
}
