import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

import { gotoFreshHomepage } from "./helpers/homepage-driver.mjs";
import { startTestServer } from "./helpers/test-server.mjs";

let browser;
let server;

async function createContext(options = {}) {
  const context = await browser.newContext({ ...options, serviceWorkers: "block" });
  // Keep every form write in memory, and avoid third-party resources delaying window load.
  await context.route("**/*", route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method()) || url.pathname.startsWith("/api/")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "homepage-mock" }) });
    }
    if (url.origin !== server.baseURL) return route.abort();
    return route.continue();
  });
  return context;
}

async function withPage(run) {
  const context = await createContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  try {
    await gotoFreshHomepage(page, server.baseURL);
    await run(page);
  } finally {
    await context.close();
  }
}

before(async () => {
  server = await startTestServer();
  browser = await chromium.launch({
    headless: process.env.QICORE_E2E_HEADED !== "1",
    channel: process.env.QICORE_E2E_CHROMIUM_CHANNEL || undefined,
  });
});

after(async () => {
  if (browser) {
    await browser.close();
  }
  if (server) {
    await server.stop();
  }
});

test("top navigation keeps cached content aligned with the URL after a direct content load", async () => {
  await withPage(async page => {
    await page.goto(`${server.baseURL}/about`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-header-ready="true"]').waitFor();
    await page.evaluate(() => { window.routeNavigationDocument = "preserved"; });

    const assertRoute = async pathname => {
      await page.waitForURL(`${server.baseURL}${pathname}`);
      await page.locator(`.qicore-route-panel.is-active > .${pathname.slice(1)}-page`).waitFor();
      await page.locator(".qicore-route-content.is-idle").waitFor();
      assert.equal(await page.locator(".qicore-route-panel.is-active > .marketing-page").count(), 1);
      assert.equal(await page.locator(`[data-site-header] nav a[href="${pathname}"]`).getAttribute("aria-current"), "page");
      assert.equal(await page.evaluate(() => window.routeNavigationDocument), "preserved");
    };

    for (const pathname of ["/news", "/about", "/news"]) {
      await page.locator(`[data-site-header] nav a[href="${pathname}"]`).click();
      await assertRoute(pathname);
    }

    await page.goBack();
    await assertRoute("/about");
    await page.goBack();
    await assertRoute("/news");
    await page.goForward();
    await assertRoute("/about");
    await page.goForward();
    await assertRoute("/news");
  });
});

const activeSiteFooter = page => {
  const pathname = new URL(page.url()).pathname;
  return page.locator(pathname === '/'
    ? '.qicore-route-shell.is-home [data-home-page] .marketing-footer'
    : `.qicore-route-panel.is-active .${pathname.slice(1)}-page .marketing-footer`);
};

async function assertSiteFooter(page, expected) {
  await page.waitForFunction(() => {
    const content = document.querySelector(".qicore-route-content");
    return !content || content.classList.contains("is-idle");
  });
  const footer = activeSiteFooter(page);
  await footer.waitFor({ state: 'visible' });
  assert.equal(await footer.count(), 1);
  assert.equal(await page.locator('.qicore-route-panel.is-active .terminal-footer').count(), 0);
  assert.equal(await page.locator('.qicore-route-panel.is-active .projection-footer').count(), 0);
  assert.equal(await footer.evaluate(el => Boolean(el.closest('.marketing-board'))), false);
  assert.equal(await footer.locator('[data-qicore-waterfall]').count(), 0);
  await footer.evaluate(async el => {
    const animations = [];
    for (let node = el; node; node = node.parentElement) animations.push(...node.getAnimations());
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
  });
  await footer.scrollIntoViewIfNeeded();
  const appearance = await footer.evaluate(el => {
    const style = node => {
      const s = getComputedStyle(node);
      return Object.fromEntries(['backgroundColor', 'padding', 'margin', 'borderTop', 'borderRadius', 'boxShadow', 'fontFamily', 'fontSize', 'color', 'gap', 'flexWrap', 'alignItems', 'minHeight'].map(key => [key, s[key]]));
    };
    return { footer: style(el), links: style(el.querySelector('.marketing-footer-links')), anchors: [...el.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.innerText, style: style(a) })), text: el.innerText };
  });
  if (expected) assert.deepEqual(appearance, expected);
  assert.equal(appearance.footer.backgroundColor, 'rgb(255, 255, 255)');
  // Route-shell transitions can start after history updates the active panel.
  // Wait for their geometry, without treating hidden cached footers as failures.
  await page.waitForFunction(el => {
    const rect = el.getBoundingClientRect();
    return Math.abs(rect.left) <= 1 && Math.abs(rect.right - document.documentElement.clientWidth) <= 1;
  }, await footer.elementHandle());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await footer.hover();
  assert.ok(await footer.evaluate(el => ['none', '0px', '0px 0px'].includes(getComputedStyle(el).translate)));
  assert.ok(await footer.evaluate(el => [el, ...el.children].every(node => getComputedStyle(node).opacity === '1' && getComputedStyle(node).animationName === 'none')));
  const link = footer.locator('a').first();
  await link.focus();
  await page.keyboard.press('Tab');
  assert.ok(await footer.locator('a[href="/careers"]').evaluate(el => document.activeElement === el && getComputedStyle(el).outlineStyle !== 'none' && el.getBoundingClientRect().height >= 44));
  assert.equal(await footer.evaluate(el => getComputedStyle(el.parentElement).paddingBottom), '0px');
  return appearance;
}

test("site footer matches home on direct loads across locales and viewports", async () => {
  await withPage(async page => {
    for (const locale of ['zh', 'en']) {
      await page.evaluate(value => localStorage.setItem('qicore-locale', value), locale);
      for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        await gotoFreshHomepage(page, server.baseURL);
        assert.equal(await page.locator('html').getAttribute('data-locale'), locale);
        const expected = await assertSiteFooter(page);
        for (const route of ['/news', '/about']) {
          await page.goto(server.baseURL + route, { waitUntil: 'domcontentloaded' });
          await page.locator('[data-header-ready="true"]').waitFor();
          await assertSiteFooter(page, expected);
        }
      }
    }
  });
});

test("site footer survives cached navigation and history while careers stays in its board", async () => {
  await withPage(async page => {
    const expected = await assertSiteFooter(page);
    for (const route of ['/news', '/about']) {
      await page.locator(`[data-site-header] nav a[href="${route}"]`).click();
      await page.waitForURL('**' + route);
      await assertSiteFooter(page, expected);
    }
    await page.goBack();
    await page.waitForURL('**/news');
    await assertSiteFooter(page, expected);
    await page.goForward();
    await page.waitForURL('**/about');
    await assertSiteFooter(page, expected);
    await page.locator('.locale-toggle').click();
    const english = await assertSiteFooter(page);
    assert.ok(english.text.includes('MAKE SMART') && english.text.includes('View openings'));
    assert.ok(!english.text.includes('查看招聘'));
    await page.goBack();
    await page.waitForURL('**/news');
    await assertSiteFooter(page, english);
    await activeSiteFooter(page).locator('a[href="/careers"]').click();
    await page.waitForURL('**/careers');
    const footer = page.locator('.careers-page .marketing-board > .marketing-footer--careers');
    assert.equal(await footer.count(), 1);
    assert.equal(await footer.locator('[data-qicore-waterfall]').count(), 3);
    assert.deepEqual(await footer.evaluate(el => {
      const s = getComputedStyle(el);
      return [s.backgroundColor, s.boxShadow, s.borderRadius, s.paddingTop, s.paddingBottom, s.marginTop];
    }), ['rgb(255, 255, 255)', 'none', '0px', '38px', '30px', '0px']);
  });
});

test("mobile menu opens with a downward reveal and respects reduced motion", async () => {
  await withPage(async page => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const toggle = page.locator('.marketing-menu-toggle');
    const menu = page.locator('#home-navigation');
    await toggle.click();
    assert.ok(await menu.evaluate(el => el.getAnimations().length > 0));
    await menu.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    assert.equal(await menu.locator('a').first().isVisible(), true);
    await toggle.click();
    assert.equal(await menu.evaluate(el => getComputedStyle(el).pointerEvents), "none");
    assert.ok(await menu.evaluate(el => el.getAnimations().length > 0), "closing transitions upward before hiding");
    await menu.waitFor({ state: "hidden" });
    await toggle.click();
    await menu.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
    assert.equal(await menu.isVisible(), false);
    assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await toggle.click();
    assert.equal(await menu.evaluate(el => getComputedStyle(el).animationName), "none");
    await page.setViewportSize({ width: 1440, height: 960 });
    assert.equal(await menu.evaluate(el => getComputedStyle(el).animationName), "none");
  });
});

test("homepage hides its scrollbar without blocking scrolling or affecting other routes", async () => {
  await withPage(async page => {
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth), "none");
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 40);
    await page.waitForFunction(() => scrollY > 0 && scrollY < 200);
    await page.locator('[data-site-header] a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.waitForFunction(() => !document.querySelector('[data-home-header]'));
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarWidth), "none");
    await page.locator('[data-site-header] a[href="/"]').first().click();
    await page.waitForURL(server.baseURL + "/");
    await page.waitForFunction(() => getComputedStyle(document.documentElement).scrollbarWidth === "none");
  });
});

test("homepage renders three image slides without the old canvas or script", async () => {
  await withPage(async (page) => {
    assert.equal(await page.locator(".swiper-slide").count(), 3);
    assert.equal(await page.locator("#canvas-area, #grid-plane, [data-home-carousel] canvas, script[src*='legacy-home']").count(), 0);
    assert.equal(await page.locator("body").evaluate(el => getComputedStyle(el).cursor), "auto");
    await page.waitForFunction(() => [...document.querySelectorAll(".swiper-slide img")].every(img => img.complete && img.naturalWidth > 0));
  });
});

test("content pages keep a light backdrop on direct loads and cached navigation", async () => {
  await withPage(async page => {
    const assertPaperBackground = async () => {
      await page.waitForFunction(() => [document.documentElement, document.body].every(
        element => getComputedStyle(element).backgroundColor === "rgb(255, 255, 255)"
      ));
      assert.equal(await page.locator('[data-site-header]').count(), 1);
    };
    for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      for (const route of ["/news", "/about"]) {
        await page.goto(server.baseURL + route, { waitUntil: "domcontentloaded" });
        await page.locator('[data-header-ready="true"]').waitFor();
        await assertPaperBackground();
      }
    }
    await gotoFreshHomepage(page, server.baseURL);
    const homeBackground = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    for (const route of ["/news", "/about"]) {
      await page.locator(`[data-site-header] nav a[href="${route}"]`).click();
      await page.waitForURL("**" + route);
      await assertPaperBackground();
    }
    await page.goBack();
    await page.waitForURL("**/about");
    await assertPaperBackground();
    await page.locator('[data-site-header] nav a[href="/"]').click();
    await page.locator('[data-home-carousel] .swiper-initialized').waitFor();
    await page.waitForFunction(expected => getComputedStyle(document.body).backgroundColor === expected, homeBackground);
  });
});

test("About uses the full-width header on direct loads, scroll and cached navigation", async () => {
  await withPage(async page => {
    for (const [width, height] of [[1440, 900], [390, 844], [834, 1194]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${server.baseURL}/about`, { waitUntil: "domcontentloaded" });
      const header = page.locator("[data-site-header]");
      await page.locator('[data-header-ready="true"]').waitFor();
      assert.equal(await page.locator("header.marketing-nav").count(), 1);
      assert.equal(await page.locator("[data-home-carousel]").count(), 0);
      assert.equal(await header.locator('[aria-current="page"]').getAttribute("href"), "/about");
      assert.equal(await header.evaluate(el => getComputedStyle(el).borderRadius), "0px");
      const rect = await header.boundingBox();
      assert.equal(rect.x, 0);
      assert.equal(rect.y, 0);
      assert.equal(rect.width, width);
      await page.evaluate(() => scrollTo(0, 650));
      await page.waitForFunction(() => window.scrollY > 100);
      assert.equal((await header.boundingBox()).y, 0, "header stays attached to viewport on scroll");
      if (width < 768) {
        await header.locator(".marketing-menu-toggle").click();
        await header.locator('.marketing-nav-links a[href="/"]').waitFor({ state: "visible" });
        await page.keyboard.press("Escape");
      }
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator('[data-header-ready="true"]').waitFor();
      assert.equal(await header.locator('[aria-current="page"]').getAttribute("href"), "/about");
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('.marketing-nav-links a[href="/news"]').click();
    await page.waitForURL("**/news");
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.locator("[data-site-header]").waitFor();
    assert.equal(await page.locator('[data-site-header] [aria-current="page"]').getAttribute("href"), "/about");
    await page.locator(".locale-toggle").click();
    await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
    await page.locator('.marketing-nav-links a[href="/"]').click();
    await page.waitForURL(server.baseURL + "/");
    await page.locator("[data-home-header]").waitFor();
    assert.equal(await page.locator('[data-site-header] [aria-current="page"]').getAttribute("href"), "/");
    await page.goBack();
    await page.waitForURL("**/about");
    await page.locator("[data-site-header]").waitFor();
    assert.equal(await page.locator('[data-site-header] [aria-current="page"]').getAttribute("href"), "/about");
  });
});

test("all routes share one responsive header and independent pages navigate back correctly", async () => {
  await withPage(async page => {
    for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      for (const route of ["/", "/news", "/about", "/careers"]) {
        await page.goto(server.baseURL + route, { waitUntil: "domcontentloaded" });
        const header = page.locator('[data-site-header][data-header-ready="true"]');
        await header.waitFor();
        assert.equal(await page.locator('[data-site-header]').count(), 1, route);
        assert.equal(await page.locator('.careers-standalone-nav, .oyscat-nav, .marketing-nav.is-qicore-site').count(), 0, route);
        const rect = await header.boundingBox();
        assert.equal(rect.x, 0, route);
        assert.equal(rect.y, 0, route);
        assert.equal(rect.width, width, route);
        assert.equal(await header.evaluate(el => getComputedStyle(el).borderRadius), "0px", route);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, route);
        assert.equal(await header.evaluate(el => el.contains(document.elementFromPoint(30, 30))), true, route);
        await header.locator('.locale-toggle').click();
        await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
        await header.locator('.locale-toggle').click();
        await page.waitForFunction(() => document.documentElement.dataset.locale === "zh");
        if (width < 768) {
          const toggle = header.locator('.marketing-menu-toggle');
          await toggle.click();
          await header.locator('nav a[href="/"]').waitFor({ state: "visible" });
          await page.keyboard.press("Escape");
          await header.locator('nav').waitFor({ state: "hidden" });
          assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
        }
      }
    }
    for (const route of ["/careers"]) {
      await page.goto(server.baseURL + route, { waitUntil: "domcontentloaded" });
      await page.locator('[data-header-ready="true"]').waitFor();
      await page.locator('[data-site-header] nav a[href="/about"]').click();
      await page.waitForURL("**/about");
      await page.locator('.qicore-route-panel.is-active .about-page').waitFor();
      await page.goBack();
      await page.waitForURL("**" + route);
      await page.locator('[data-header-ready="true"]').waitFor();
      await page.locator('[data-site-header] > a[href="/"]').click();
      await page.locator('[data-home-carousel] .swiper-initialized').waitFor();
    }
  });
});

test("pagination and keyboard navigation wrap without side arrows", async () => {
  await withPage(async page => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator("[data-home-arrow]").count(), 0);
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).click();
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "0");
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "0");
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).click();
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
    assert.equal(await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).getAttribute("aria-current"), "true");
  });
});

test("carousel and top header fill phone, tablet and desktop viewports", async () => {
  await withPage(async page => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024], [834, 1194], [1024, 768], [1440, 900], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => scrollTo(0, 0));
      const frame = await page.locator("[data-home-carousel]").boundingBox();
      assert.deepEqual(frame, { x: 0, y: 0, width, height });
      const header = await page.locator("[data-home-header]").boundingBox();
      assert.equal(header.x, 0);
      assert.equal(header.y, 0);
      assert.equal(header.width, width);
      assert.equal(await page.locator(".marketing-menu-toggle").isVisible(), width < 768);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const title = await page.locator(".swiper-slide-active h1").boundingBox();
      const link = await page.locator(".swiper-slide-active a").boundingBox();
      const pagination = await page.locator("[data-carousel-pagination]").boundingBox();
      assert.ok(title.y >= header.height, `title below header at ${width}x${height}`);
      assert.ok(link.y + link.height <= pagination.y, `CTA above pagination at ${width}x${height}`);
      assert.equal(await page.locator("[data-home-arrow]").count(), 0);
    }
  });
});

test("carousel has no side arrows on hover or keyboard focus", async () => {
  await withPage(async page => {
    await page.mouse.move(200, 250);
    await page.waitForTimeout(300);
    assert.equal(await page.locator("[data-home-arrow]").count(), 0);
    assert.equal(await page.getByRole("button", { name: /上一张|下一张|Previous slide|Next slide/ }).count(), 0);
    await page.keyboard.press("Tab");
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
    assert.equal(await page.locator("[data-home-arrow]").count(), 0);
    await page.screenshot({ path: fileURLToPath(new URL("../../../.artifacts/home-story/carousel-without-arrows.png", import.meta.url)) });
  });
});

test("carousel images randomly zoom in or out faster without changing the Swiper track", async () => {
  await withPage(async page => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(() => document.querySelector(".swiper-slide-active img").getAnimations().length > 0);
    await page.evaluate(() => document.querySelector(".swiper").swiper.autoplay.stop());
    for (const [index, random, direction, from, to] of [[1, 0.1, "in", 1, 1.12], [0, 0.9, "out", 1.12, 1], [1, 0.9, "out", 1.12, 1]]) {
      await page.evaluate(({ index, random }) => {
        Math.random = () => random;
        document.querySelector(".swiper").swiper.slideToLoop(index, 0);
      }, { index, random });
      await page.waitForFunction(({ index, direction }) => {
        const root = document.querySelector("[data-home-carousel]");
        const image = root.querySelector(".swiper-slide-active img");
        return root.dataset.activeSlide === String(index) && image.dataset.carouselZoom === direction && image.getAnimations().length > 0;
      }, { index, direction });
      const motion = await page.locator(".swiper-slide-active img").evaluate(async image => {
        const animation = image.getAnimations()[0];
        animation.pause();
        const duration = animation.effect.getTiming().duration;
        const frames = animation.effect.getKeyframes().map(frame => frame.transform);
        animation.currentTime = 0;
        await new Promise(requestAnimationFrame);
        const start = new DOMMatrix(getComputedStyle(image).transform).a;
        animation.currentTime = duration;
        await new Promise(requestAnimationFrame);
        const end = new DOMMatrix(getComputedStyle(image).transform).a;
        return { duration, frames, start, end };
      });
      assert.equal(motion.duration, 3800);
      assert.deepEqual(motion.frames, [`scale(${from})`, `scale(${to})`]);
      assert.ok(Math.abs(motion.start - from) < 0.0001);
      assert.ok(Math.abs(motion.end - to) < 0.0001);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => [...document.querySelectorAll(".home-carousel-image")].every(image => image.getAnimations().length === 0));
    assert.equal(await page.locator(".swiper-slide-active img").evaluate(image => getComputedStyle(image).transform), "none");
  });
});

test("pagination expands into a capsule and collapses on deselect", async () => {
  await withPage(async page => {
    const first = page.getByRole("button", { name: /^(?:第 1 张|Slide 1)$/ });
    const marker = await first.locator("span").boundingBox();
    assert.equal(marker.width, 32);
    assert.equal(marker.height, 8);
    assert.ok((await first.boundingBox()).width >= 44);
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).click();
    // Swiper schedules loop movement in a frame; wait for the actual slide, then CSS widths.
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
    await page.waitForFunction(() => !document.querySelector(".swiper").swiper.animating);
    await page.waitForFunction(() => {
      const markers = document.querySelectorAll('[data-carousel-pagination] button > span');
      return markers[0].getBoundingClientRect().width === 8 && markers[1].getBoundingClientRect().width === 32;
    });
    assert.equal((await first.locator("span").boundingBox()).width, 8);
    assert.equal((await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).locator("span").boundingBox()).width, 32);
  });
});

test("touch pagination works without side arrows or mobile-menu conflicts", async () => {
  const context = await createContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await gotoFreshHomepage(page, server.baseURL);
    assert.equal(await page.locator("[data-home-arrow]").count(), 0);
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).tap();
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
    await page.locator(".marketing-menu-toggle").tap();
    assert.equal(await page.locator("#home-navigation").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-home-arrow]").count(), 0);
  } finally { await context.close(); }
});

test("carousel autoplays on hover and pauses only for keyboard focus", async () => {
  await withPage(async (page) => {
    await page.mouse.move(200, 250);
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide !== "0", null, { timeout: 8000 });
    await page.keyboard.press("Tab");
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).focus();
    const focused = await page.locator("[data-home-carousel]").getAttribute("data-active-slide");
    await page.waitForTimeout(5500);
    assert.equal(await page.locator("[data-home-carousel]").getAttribute("data-active-slide"), focused);
    await page.evaluate(() => document.activeElement.blur());
    await page.waitForFunction(value => document.querySelector("[data-home-carousel]").dataset.activeSlide !== value, focused, { timeout: 8000 });
    assert.equal(await page.getByRole("button", { name: /Play slideshow|Pause slideshow/ }).count(), 0);
  });
});

test("carousel supports mobile swiping without horizontal overflow", async () => {
  const context = await createContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await gotoFreshHomepage(page, server.baseURL);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 320, y: 340 }] });
    for (let x = 300; x >= 60; x -= 30) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: 340 }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    assert.equal(await page.locator("[data-home-arrow]").count(), 0);
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
    assert.equal(await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).getAttribute("aria-current"), "true");
    await page.waitForFunction(() => !document.querySelector(".swiper").swiper.animating);
    await page.screenshot({ path: fileURLToPath(new URL("../../../.artifacts/home-story/carousel-mobile.png", import.meta.url)) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 600 }] });
    for (let y = 560; y >= 180; y -= 40) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(() => scrollY > 100);
    assert.equal(await page.locator("[data-home-carousel]").getAttribute("data-active-slide"), "1");
  } finally {
    await context.close();
  }
});

test("reduced motion disables autoplay while pagination still works", async () => {
  await withPage(async (page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.locator(".swiper-initialized").waitFor();
    assert.equal(await page.locator(".swiper-slide-active img").evaluate(el => getComputedStyle(el).animationName), "none");
    await page.waitForTimeout(5500);
    assert.equal(await page.locator("[data-home-carousel]").getAttribute("data-active-slide"), "0");
    await page.mouse.move(100, 200);
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).click();
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
  });
});

test("returning from a company page restores an interactive carousel", async () => {
  await withPage(async (page) => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    assert.equal(await page.locator("[data-home-carousel]").count(), 0);
    await page.locator('.marketing-nav-links a[href="/"]').click();
    await page.waitForURL(server.baseURL + "/");
    await page.locator(".swiper-initialized").waitFor();
    await page.waitForFunction(() => document.querySelector(".qicore-route-content")?.classList.contains("is-idle"));
    await page.mouse.move(100, 200);
    await page.getByRole("button", { name: /^(?:第 2 张|Slide 2)$/ }).click();
    await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "1");
  });
});

test("homepage product and careers links remain available", async () => {
  await withPage(async (page) => {
    assert.equal(await page.locator('[data-home-section="product"] a[href="https://beta-hk.oyscat.com/"]').first().getAttribute("href"), "https://beta-hk.oyscat.com/");
    await page.goto(server.baseURL);
    await page.locator(".swiper-initialized").waitFor();
    await page.getByRole("button", { name: /^(?:第 3 张|Slide 3)$/ }).click();
    await page.locator('.swiper-slide-active a[href="/careers"]').click();
    await page.waitForURL("**/careers");
    assert.equal(await page.locator(".careers-page").isVisible(), true);
  });
});

test("mobile navigation reaches company content pages", async () => {
  await withPage(async (page) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.locator(".marketing-menu-toggle").click();
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.locator(".locale-toggle").click();
    await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
    assert.equal(await page.getByRole("heading", { name: "MAKE SMART" }).isVisible(), true);
  });
});

test("saved English locale is applied before hydration", async () => {
  const context = await createContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  try {
    await page.addInitScript(() => {
      window.localStorage.setItem("qicore-locale", "en");
      window.sessionStorage.setItem("qicore-route-entry", JSON.stringify({
        kind: "from-home",
        target: "/about",
        at: Date.now(),
      }));
    });
    await page.route("**/*.js", (route) => route.abort());
    await page.goto(`${server.baseURL}/about`, { waitUntil: "domcontentloaded" });

    assert.equal(await page.locator("html").getAttribute("data-locale"), "en");
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.equal(await page.getByRole("heading", { name: "MAKE SMART" }).isVisible(), true);
    assert.equal(await page.getByRole("heading", { name: "让智能硬件更容易被创造。" }).isVisible(), false);
    assert.equal(
      await page.locator('[data-qicore-waterfall="0"]').evaluate((element) => getComputedStyle(element).animationName),
      "qicore-waterfall-arrive"
    );
    await page.waitForFunction(() => {
      const item = document.querySelector('[data-qicore-waterfall="0"]');
      return item && Number.parseFloat(getComputedStyle(item).opacity) > 0.1;
    });
  } finally {
    await context.close();
  }
});

test("in-place company navigation preserves the waterfall entry animation", async () => {
  await withPage(async (page) => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.waitForFunction(() => {
      const item = document.querySelector('.qicore-route-panel.is-active [data-qicore-waterfall="0"]');
      return item && getComputedStyle(item).animationName === "qicore-waterfall-arrive";
    });

    assert.equal(await page.locator("body").evaluate((element) => getComputedStyle(element).cursor), "auto");
    assert.equal(
      await page.locator(".qicore-route-content").evaluate((element) => getComputedStyle(element).pointerEvents),
      "auto"
    );

    assert.equal(
      await page.locator('.qicore-route-panel.is-active [data-qicore-waterfall="0"]').evaluate((element) => getComputedStyle(element).animationName),
      "qicore-waterfall-arrive"
    );

    await page.locator('.marketing-nav-links a[href="/news"]').click();
    await page.waitForURL("**/news");
    await page.waitForFunction(() => document.querySelector(".qicore-route-panel.is-outgoing h1"));
    assert.match(
      await page.locator(".qicore-route-panel.is-outgoing h1").textContent(),
      /MAKE SMART/,
      "the outgoing layer must retain the previous page"
    );
    assert.match(
      await page.locator(".qicore-route-panel.is-active h1").textContent(),
      /Creation in motion/,
      "the active layer must contain only the destination page"
    );
    assert.notEqual(
      await page.locator(".qicore-route-panel.is-outgoing .marketing-board").evaluate((element) => getComputedStyle(element).animationName),
      "qicore-drawer-close",
      "internal navigation must not reuse the legacy document-exit animation"
    );
    await page.waitForFunction(() => {
      const item = document.querySelector('.qicore-route-panel.is-active [data-qicore-waterfall="0"]');
      return item && getComputedStyle(item).animationName === "qicore-waterfall-arrive";
    });

    assert.equal(
      await page.locator('.qicore-route-panel.is-active [data-qicore-waterfall="0"]').evaluate((element) => getComputedStyle(element).animationDuration),
      "0.94s"
    );
    assert.equal(
      await page.locator(".qicore-route-panel.is-outgoing").evaluate((element) => getComputedStyle(element).animationDuration),
      "0.7s"
    );

    assert.equal(
      await page.locator('.qicore-route-panel.is-active [data-qicore-waterfall="0"]').evaluate((element) => getComputedStyle(element).animationName),
      "qicore-waterfall-arrive"
    );
  });
});

test("cached company-page illustrations keep pointer and click interactions", async () => {
  await withPage(async (page) => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.locator('.marketing-nav-links a[href="/news"]').click();
    await page.waitForURL("**/news");

    const newsArt = page.locator(".qicore-route-panel.is-active .themed-hero-art");
    await page.waitForFunction(() => document.querySelector(".qicore-route-content")?.classList.contains("is-idle"));
    const newsCard = newsArt.locator(".hero-blueprint-card");
    await newsCard.waitFor({ state: "visible" });
    const newsBox = await newsCard.boundingBox();
    assert.ok(newsBox, "the cached news illustration should be visible");
    await page.mouse.move(newsBox.x + newsBox.width * .78, newsBox.y + newsBox.height * .24);
    await page.waitForFunction(() => (
      document.querySelector(".qicore-route-panel.is-active .hero-blueprint-card")?.dataset.pointerActive === "true"
    ));
    assert.notEqual(await newsCard.evaluate((element) => getComputedStyle(element).transform), "none");
    await newsArt.click();
    assert.equal(await newsArt.getAttribute("aria-pressed"), "true");

    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    const teamArt = page.locator(".qicore-route-panel.is-active .themed-hero-art");
    await page.waitForFunction(() => document.querySelector(".qicore-route-content")?.classList.contains("is-idle"));
    await teamArt.click();
    assert.equal(await teamArt.getAttribute("aria-pressed"), "true");
    assert.equal(await teamArt.evaluate((element) => element.classList.contains("is-hero-activated")), true);
  });
});

test("cached news content keeps its native story disclosure interactive", async () => {
  await withPage(async (page) => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.locator('.marketing-nav-links a[href="/news"]').click();
    await page.waitForURL("**/news");

    await page.waitForFunction(() => document.querySelector(".qicore-route-content")?.classList.contains("is-idle"));
    const story = page.locator(".qicore-route-panel.is-active .news-entry");
    assert.equal(await story.getAttribute("open"), null);
    await story.locator(".news-entry-toggle").click();
    assert.equal(await story.getAttribute("open"), "");
    assert.match(await story.locator(".news-entry-toggle").innerText(), /Close story|收起正文/);
  });
});

test("QiCore film plays inline without leaving the About page", async () => {
  await withPage(async (page) => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.waitForFunction(() => document.querySelector(".qicore-route-content")?.classList.contains("is-idle"));

    await page.locator(".qicore-film-poster").click();
    const player = page.locator(".qicore-film-screen iframe");
    assert.equal(await player.count(), 1);
    assert.match(await player.getAttribute("src"), /youtube-nocookie\.com\/embed\/kXsAVhzLfh4/);
    assert.match(page.url(), /\/about$/);

    await page.locator(".qicore-film-close").click();
    assert.equal(await player.count(), 0);
    assert.equal(await page.locator(".qicore-film-poster").count(), 1);

    await page.locator(".qicore-film-poster").click();
    await page.keyboard.press("Escape");
    assert.equal(await player.count(), 0);
  });
});

test("news and company navigation share the QiCore route shell", async () => {
  await withPage(async (page) => {
    const routeDataRequests = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith(".txt")) routeDataRequests.push(request.url());
    });
    await page.evaluate(() => {
      window.__QICORE_SHELL_NODE_PROBE__ = document.querySelector(".qicore-route-shell");
    });
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");

    assert.equal(
      await page.evaluate(() => window.__QICORE_SHELL_NODE_PROBE__ === document.querySelector(".qicore-route-shell")),
      true,
      "the shared QiCore shell must survive company navigation"
    );
    assert.equal(await page.evaluate(() => document.contentType), "text/html");
    assert.deepEqual(routeDataRequests, [], "QiCore navigation must not request static RSC .txt files");

    await page.goBack();
    await page.waitForURL(`${server.baseURL}/`);
    assert.equal(
      await page.evaluate(() => window.__QICORE_SHELL_NODE_PROBE__ === document.querySelector(".qicore-route-shell")),
      true,
      "browser history must preserve the shared shell"
    );
    await page.goForward();
    await page.waitForURL(`${server.baseURL}/about`);
    await page.waitForFunction(() => document.querySelector(".qicore-route-panel.is-active h1"));
    assert.match(
      await page.locator(".qicore-route-panel.is-active h1").textContent(),
      /MAKE SMART/
    );

    await page.evaluate(() => {
      document.documentElement.dataset.navigationDocumentProbe = "stale-company-page";
    });
    await page.locator('.marketing-nav-links a[href="/news"]').click();
    await page.waitForURL("**/news");

    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.navigationDocumentProbe),
      "stale-company-page",
      "the QiCore document must survive content navigation"
    );
    assert.equal(
      await page.evaluate(() => window.__QICORE_SHELL_NODE_PROBE__ === document.querySelector(".qicore-route-shell")),
      true,
      "the shared shell must remain mounted on the news page",
    );
    assert.equal(await page.locator(".qicore-route-panel.is-active .news-page").count(), 1);
    assert.equal(await page.evaluate(() => document.contentType), "text/html");
  });
});

test("about layout styles survive careers to home navigation", async () => {
  await withPage(async (page) => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.locator('#team').waitFor({ state: "visible" });

    await page.locator('.marketing-nav-links a[href="/careers"]').click();
    await page.waitForURL("**/careers");
    await page.locator('[data-site-header] > a[href="/"]').click();
    await page.waitForURL(server.baseURL + "/");

    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.locator('#team').waitFor({ state: "visible" });

    await page.waitForFunction(() => document.querySelector(".qicore-route-content")?.classList.contains("is-idle"));
    const beforeReload = await page.locator('.qicore-route-panel.is-active #team article').first().evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: parseFloat(style.width), height: parseFloat(style.height), display: style.display };
    });
    assert.equal(beforeReload.display, "block");
    assert.ok(beforeReload.width > 0 && beforeReload.width < 400);
    assert.ok(beforeReload.height > 0);

    // The homepage-aligned About surface is one full-width warm board with a single
    // film band surviving the shared route shell; no legacy paper cards remain.
    assert.equal(await page.locator(".qicore-route-panel.is-active .marketing-board").evaluate(e => getComputedStyle(e).backgroundColor), "rgb(255, 255, 255)");
    const filmSurface = await page.locator('.qicore-route-panel.is-active .marketing-board > section.marketing-section').evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderRadius: style.borderRadius,
      };
    }));
    assert.equal(filmSurface.length, 1);
    assert.equal(filmSurface[0].backgroundColor, "rgb(255, 255, 255)");
    assert.equal(filmSurface[0].backgroundImage, "none");
    assert.equal(filmSurface[0].borderRadius, "0px");

    const personCardBackgrounds = await page.locator('#team article').evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).backgroundColor),
    );
    assert.equal(new Set(personCardBackgrounds).size, 1);
    assert.equal(personCardBackgrounds[0], "rgba(0, 0, 0, 0)");

    await page.reload();
    const afterReload = await page.locator('#team article').first().evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: parseFloat(style.width), height: parseFloat(style.height), display: style.display };
    });
    assert.equal(afterReload.display, beforeReload.display);
    assert.ok(
      Math.abs(afterReload.width - beforeReload.width) < 1,
      JSON.stringify({ beforeReload, afterReload }),
    );
    assert.ok(
      Math.abs(afterReload.height - beforeReload.height) < 1,
      JSON.stringify({ beforeReload, afterReload }),
    );
  });
});

test("homepage small wheel inputs remain native instead of forcing a full-screen landing", async () => {
  await withPage(async page => {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      await page.emulateMedia({ reducedMotion });
      await page.evaluate(() => scrollTo(0, 0));
      await page.mouse.move(700, 450);
      await page.mouse.wheel(0, 40);
      await page.waitForFunction(() => scrollY > 0);
      await page.waitForTimeout(700);
      assert.ok(await page.evaluate(() => scrollY > 0 && scrollY < 200), "small wheel does not snap to the next chapter");
      await page.mouse.wheel(0, -40);
      await page.waitForFunction(() => scrollY < 5);
    }
  });
});

test("homepage native scrolling continues from partial hero positions and supports PageDown", async () => {
  await withPage(async page => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const start = await page.evaluate(() => innerHeight * 0.5);
    await page.evaluate(top => scrollTo(0, top), start);
    await page.mouse.wheel(0, 40);
    await page.waitForFunction(top => scrollY > top, start);
    await page.waitForTimeout(700);
    assert.ok(await page.evaluate(top => scrollY < top + 200, start));
    await page.evaluate(() => scrollTo(0, 0));
    await page.keyboard.press("PageDown");
    await page.waitForFunction(() => scrollY > 100);
    assert.ok(await page.evaluate(() => scrollY < innerHeight * 1.2));
  });
});

test("all page headers use the homepage light surface", async () => {
  await withPage(async page => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const route of ["/", "/news", "/about", "/careers"]) {
      await page.goto(server.baseURL + route, { waitUntil: "domcontentloaded" });
      const header = page.locator("[data-site-header]");
      await header.waitFor();
      await page.locator("[data-header-ready=\"true\"]").waitFor();
      assert.equal(await header.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)", route);
      assert.equal(await header.evaluate(el => getComputedStyle(el).color), "rgb(32, 40, 32)", route);
      assert.equal(await header.evaluate(el => getComputedStyle(el, "::before").backgroundImage), "none", route);
      await page.evaluate(() => scrollTo(0, 150));
      await page.waitForFunction(() => window.scrollY > 0 || location.pathname === "/");
      assert.equal(await header.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)", route);
    }
  });
});

test("homepage brand sections scroll, localize and navigate without reloading", async () => {
  await withPage(async page => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => { window.homeDocumentMarker = "same-document"; });
    assert.deepEqual(await page.locator("[data-home-section]").evaluateAll(nodes => nodes.map(node => node.dataset.homeSection)), ["capabilities", "news"]);
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      for (const locale of ["zh", "en"]) {
        if (await page.locator("html").getAttribute("data-locale") !== locale) await page.locator(".locale-toggle").click();
        await page.locator("[data-home-page] .marketing-footer").scrollIntoViewIfNeeded();
        await page.waitForFunction(() => scrollY > innerHeight);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.locator("[data-home-scrolled]").waitFor();
        assert.equal(await page.locator("[data-site-header]").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(255, 255, 255)");
        assert.equal((await page.locator("[data-site-header]").boundingBox()).y, 0);
        const image = page.locator("[data-home-section] img[data-alt-zh]").first();
        assert.equal(await image.getAttribute("alt"), await image.getAttribute(`data-alt-${locale}`));
      }
    }
    for (const section of await page.locator("[data-home-section]").all()) {
      await section.scrollIntoViewIfNeeded();
      for (const image of await section.locator("img").all()) await image.evaluate(img => img.decode());
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: fileURLToPath(new URL("../../../.artifacts/home-story/home-desktop-static.png", import.meta.url)), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: fileURLToPath(new URL("../../../.artifacts/home-story/home-mobile-static.png", import.meta.url)), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.keyboard.press("Tab");
    await page.locator('[data-home-section="news"] a').focus();
    assert.equal(await page.locator('[data-home-section="news"] a').evaluate(el => getComputedStyle(el).outlineStyle), "solid");
    await page.keyboard.press("Enter");
    await page.waitForURL("**/news");
    await page.locator(".qicore-route-panel.is-active .news-page").waitFor();
    assert.equal(await page.evaluate(() => window.homeDocumentMarker), "same-document");
    await page.locator('[data-site-header] > a[href="/"]').click();
    await page.waitForURL(server.baseURL + "/");
    await page.locator("[data-home-page]").waitFor();
    await page.waitForFunction(() => scrollY === 0);
    await page.locator("[data-home-page] .marketing-footer").scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => scrollY > innerHeight));
    await page.goBack();
    await page.waitForURL("**/news");
    await page.goForward();
    await page.waitForURL(server.baseURL + "/");
    await page.locator("[data-home-page] .marketing-footer").scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => window.homeDocumentMarker), "same-document");
  });
});
