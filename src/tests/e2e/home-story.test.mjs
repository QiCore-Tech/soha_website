import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";
import { startTestServer } from "./helpers/test-server.mjs";
import { gotoFreshHomepage } from "./helpers/homepage-driver.mjs";

let server;
const browsers = new Map();
// Explicit opt-in for machines waiting for browser downloads; defaults still require both engines.
const engines = (process.env.QICORE_E2E_ENGINES || "chromium,webkit").split(",");
if (engines.some(engine => !["chromium", "webkit"].includes(engine))) throw new Error("Unknown QICORE_E2E_ENGINES");
before(async () => {
  server = await startTestServer();
  for (const engine of [chromium, webkit].filter(engine => engines.includes(engine.name()))) {
    browsers.set(engine.name(), await engine.launch(engine === chromium ? { channel: process.env.QICORE_E2E_CHROMIUM_CHANNEL || undefined } : {}));
  }
});
after(async () => {
  for (const browser of browsers.values()) await browser.close();
  await server?.stop();
});
const artifact = (name) => fileURLToPath(new URL(`../../../.artifacts/home-story/${name}.png`, import.meta.url));

async function withPage(engine, run, { viewport = { width: 1440, height: 900 }, reducedMotion = "no-preference", low = false, setup } = {}) {
  const context = await browsers.get(engine).newContext({ viewport, reducedMotion, serviceWorkers: "block" });
  context.setDefaultTimeout(15000);
  await context.addInitScript(({ low }) => {
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => low ? 4 : 12 });
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 8 });
  }, { low });
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method()) || url.pathname.startsWith("/api/")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "home-story-mock" }) });
    }
    if (url.origin !== server.baseURL) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !/Failed to load resource|net::ERR_FAILED|404 \(Not Found\)/.test(message.text())) errors.push(message.text());
  });
  try {
    await setup?.(page, context);
    await gotoFreshHomepage(page, server.baseURL);
    await run(page);
    assert.deepEqual(errors, [], "no uncaught application errors");
  } finally { await context.close(); }
}

async function waitMode(page, mode) {
  await page.waitForFunction(value => document.querySelector("[data-home-story]")?.dataset.homeMotion === value, mode);
  if (mode === "full") await page.waitForFunction(() => document.querySelector("[data-home-creations-pin]")?.closest(".pin-spacer") !== null);
}
async function scrollChapter(page, chapter, fraction = 0.5) {
  await page.evaluate(({ chapter, fraction }) => {
    const stage = document.querySelector("[data-home-laptop-stage]");
    const spacer = stage.closest(".pin-spacer");
    const top = spacer.getBoundingClientRect().top + scrollY;
    const offset = document.querySelector("[data-site-header]").getBoundingClientRect().bottom + 16;
    scrollTo(0, top - offset + innerHeight * (chapter === "workspace" ? 1.15 : 0.9) * fraction);
  }, { chapter, fraction });
  await page.waitForTimeout(800);
}

async function scrollCreations(page, fraction = 0.5) {
  await page.evaluate(fraction => {
    const pin = document.querySelector("[data-home-creations-pin]");
    const spacer = pin.closest(".pin-spacer");
    const top = spacer.getBoundingClientRect().top + scrollY;
    scrollTo(0, top + innerHeight * 1.8 * fraction);
  }, fraction);
  await page.waitForTimeout(800);
}

for (const engine of engines) {
  test(`${engine}: desktop has two reversible pinned chapters and accessible controls`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "full");
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 2);
      await page.locator(".swiper-slide-active img").evaluate(image => image.decode());
      await page.screenshot({ path: artifact(`${engine}-desktop-hero`) });
      for (const chapter of ["workspace"]) {
        await scrollChapter(page, chapter, 0.35);
        const stage = page.locator("[data-home-laptop-stage]");
        const early = await stage.boundingBox();
        await scrollChapter(page, chapter, 0.75);
        const later = await stage.boundingBox();
        assert.ok(Math.abs(early.y - later.y) < 2, "stage stays pinned");
        const header = await page.locator("[data-site-header]").boundingBox();
        assert.ok(later.y >= header.y + header.height, "stage stays below navigation");
        assert.ok(later.y + later.height <= 902, "stage fits the available viewport");
        await page.screenshot({ path: artifact(`${engine}-desktop-${chapter}`) });
        await scrollChapter(page, chapter, 0.1);
        assert.ok(await stage.isVisible());
      }
      for (const image of await page.locator('[data-home-section="creations"] img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(image => image.decode());
      }
      await scrollCreations(page, 0.1);
      const creationsPin = page.locator('[data-home-creations-pin]');
      const creationsScene = page.locator('[data-home-creations-scene]');
      const early = await creationsScene.boundingBox();
      await scrollCreations(page, 0.5);
      const center = await creationsScene.boundingBox();
      const pinned = await creationsPin.boundingBox();
      const creationImage = creationsScene.locator("img").first();
      assert.equal(await creationImage.evaluate(el => getComputedStyle(el.parentElement.parentElement).cursor), "pointer", "creation image shows a pointer cursor");
      const imageRest = await creationImage.evaluate(el => getComputedStyle(el).transform);
      await creationImage.hover();
      await page.waitForTimeout(260);
      assert.notEqual(await creationImage.evaluate(el => getComputedStyle(el).transform), imageRest, "creation image hover scales independently");
      await page.mouse.move(0, 0);
      await page.waitForTimeout(560);
      assert.equal(await creationImage.evaluate(el => getComputedStyle(el).transform), imageRest, "creation image returns after hover");
      await scrollCreations(page, 0.9);
      const late = await creationsScene.boundingBox();
      assert.ok(early.x > center.x + 20, 'creation scene enters from the right');
      assert.ok(late.x < center.x - 20, 'creation scene exits to the left');
      await scrollCreations(page, 0.5);
      const reverseCenter = await creationsScene.boundingBox();
      await scrollCreations(page, 0.1);
      const reverseEarly = await creationsScene.boundingBox();
      assert.ok(Math.abs(reverseCenter.x - center.x) < 20, 'creation scene returns to center when scrolling back');
      assert.ok(reverseEarly.x > reverseCenter.x + 20, 'creation scene reverses toward the right');
      assert.ok(Math.abs(pinned.y - (await creationsPin.boundingBox()).y) < 2, 'creation pin remains stable');
      assert.equal(await page.locator('[data-home-creations-pin] a').count(), 0, 'CTA stays outside the moving scene');
      assert.equal(await page.locator('[data-home-section="creations"] a').count(), 0, "creations section has no CTA");
      await page.screenshot({ path: artifact(`${engine}-desktop-creations`) });
const news = page.locator('[data-home-section="news"]');
      const newsArticle = news.locator('article');
      await newsArticle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      assert.ok(await newsArticle.isVisible(), 'fifth screen article remains visible');
      await page.locator("[data-home-page] .marketing-footer").scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      await page.screenshot({ path: artifact(`${engine}-desktop-footer`) });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    });
  });

  test(`${engine}: third screen stays static and only scales briefly on hover`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "full");
      const stage = page.locator("[data-home-intro-static]");
      const image = stage.locator("img");
      await stage.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
      assert.equal(await stage.evaluate(el => el.closest(".pin-spacer") === null), true, "static product screen must not be pinned");
      const src = await image.getAttribute("src");
      assert.ok(src.includes("/media/new/") && decodeURIComponent(src).includes("双目探险机器人.png"));
      const before = await image.evaluate(el => getComputedStyle(el).transform);
      await image.hover();
      await page.waitForTimeout(260);
      const hovered = await image.evaluate(el => getComputedStyle(el).transform);
      assert.notEqual(hovered, before, "hover briefly enlarges the product image");
      await page.mouse.move(0, 0);
      await page.waitForTimeout(560);
      assert.equal(await image.evaluate(el => getComputedStyle(el).transform), before, "image returns to its resting size after hover");
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 2);
      await page.screenshot({ path: artifact(`${engine}-desktop-intro-static-hover`) });
    });
  });

  test(`${engine}: pinned English content fits the minimum supported desktop viewport`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "full");
      for (const [width, height] of [[1200, 760], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        for (const locale of ["zh", "en"]) {
          if (await page.locator("html").getAttribute("data-locale") !== locale) await page.locator(".locale-toggle").click();
          await page.waitForTimeout(250);
          for (const chapter of ["workspace"]) {
            await scrollChapter(page, chapter, 0.5);
            const box = await page.locator("[data-home-laptop-stage]").boundingBox();
            assert.ok(box.y + box.height <= height + 2, `${chapter} fits ${width}x${height} ${locale}: ${JSON.stringify(box)}`);
          }
        }
      }
    });
  });

  test(`${engine}: all viewport/locale combinations remain readable with motion disabled`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "static");
      for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        for (const locale of ["zh", "en"]) {
          if (await page.locator("html").getAttribute("data-locale") !== locale) await page.locator(".locale-toggle").click();
          assert.equal(await page.locator("html").getAttribute("lang"), locale === "zh" ? "zh-CN" : "en");
          for (const chapter of ["workspace"]) {
            const stage = page.locator("[data-home-laptop-stage]");
            await stage.scrollIntoViewIfNeeded();
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
            assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 0);
          }
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: artifact(`${engine}-${width}x${height}-${locale}`), fullPage: true });
        }
      }
    }, { reducedMotion: "reduce" });
  });

  test(`${engine}: resize, reduced motion and locale refresh do not leave duplicate pinning`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "full");
      await scrollChapter(page, "workspace");
      await page.locator(".locale-toggle").click();
      await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => scrollY > innerHeight));
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 2);
      await page.setViewportSize({ width: 844, height: 390 });
      await waitMode(page, "light");
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 0);
      await page.setViewportSize({ width: 1440, height: 900 });
      await waitMode(page, "full");
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 2);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await waitMode(page, "static");
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 0);
      assert.equal(await page.locator("[data-home-stack]").count(), 0);
    });
  });

  test(`${engine}: ten cached-navigation round trips do not retain homepage pin spacers`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "full");
      await page.evaluate(() => { window.homeStoryDocument = "preserved"; });
      for (let index = 0; index < 10; index++) {
        const path = ["/about", "/news"][index % 2];
        await page.evaluate(href => window.dispatchEvent(new CustomEvent("qicore:navigate", { cancelable: true, detail: { href } })), path);
        await page.waitForURL(`**${path}`);
        await page.locator(".qicore-route-panel.is-active").waitFor();
        assert.equal(await page.locator("[data-home-story]").count(), 0);
        assert.equal(await page.locator(".pin-spacer").count(), 0);
        await page.locator('[data-site-header] > a[href="/"]').click();
        await page.waitForURL(server.baseURL + "/");
        await waitMode(page, "full");
        assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 2);
        assert.equal(await page.evaluate(() => window.homeStoryDocument), "preserved");
      }
      await page.goBack();
      await page.waitForURL("**/about");
      assert.equal(await page.locator(".pin-spacer").count(), 0);
      await page.goForward();
      await waitMode(page, "full");
    });
  });

  test(`${engine}: low performance keeps the workspace readable and does not autoplay`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "static");
      // This is a visibility/state test, not a click: native scrolling avoids background-WebKit RAF actionability waits.
      await page.locator("[data-home-workspace-video]").evaluate(video => video.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForTimeout(300);
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 0);
      assert.ok(await page.locator("[data-home-workspace-video]").evaluate(video => video.paused));
      assert.equal(await page.locator("[data-home-stack]").count(), 0);
    }, { low: true });
  });

  test(`${engine}: video follows visibility and reduced-motion changes without scroll seeking`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "full");
      await scrollChapter(page, "workspace");
      await page.locator('[data-home-video-state="playing"]').waitFor();
      await page.locator("[data-home-page] .marketing-footer").scrollIntoViewIfNeeded();
      await page.locator('[data-home-video-state="paused"]').waitFor();
      await scrollChapter(page, "workspace");
      await page.locator('[data-home-video-state="playing"]').waitFor();
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.locator('[data-home-video-state="paused"]').waitFor();
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.locator('[data-home-video-state="playing"]').waitFor();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await waitMode(page, "static");
      await page.locator('[data-home-video-state="paused"]').waitFor();
    });
  });

  test(`${engine}: autoplay rejection is contained and user pause survives scrolling`, async () => {
    await withPage(engine, async page => {
      await waitMode(page, "full");
      await scrollChapter(page, "workspace");
      await page.locator('[data-home-video-state="blocked"]').waitFor();
      assert.equal(await page.evaluate(() => window.homePlayAttempts), 1);
      await page.evaluate(() => { window.rejectHomePlay = false; });
      await page.locator("[data-home-video-toggle]").click();
      await page.locator('[data-home-video-state="playing"]').waitFor();
      await page.locator("[data-home-video-toggle]").click();
      await page.locator('[data-home-video-state="paused"]').waitFor();
      const attempts = await page.evaluate(() => window.homePlayAttempts);
      await page.locator("[data-home-page] .marketing-footer").scrollIntoViewIfNeeded();
      await scrollChapter(page, "workspace");
      assert.equal(await page.evaluate(() => window.homePlayAttempts), attempts);
      assert.ok(await page.locator("[data-home-workspace-video]").evaluate(video => video.paused));
    }, { setup: async (_page, context) => {
      await context.addInitScript(() => {
        window.rejectHomePlay = true;
        window.homePlayAttempts = 0;
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          if (this.hasAttribute("data-home-workspace-video")) {
            window.homePlayAttempts++;
            if (window.rejectHomePlay) return Promise.reject(new DOMException("Autoplay blocked", "NotAllowedError"));
          }
          return play.call(this);
        };
      });
    } });
  });

  test(`${engine}: failed ScrollTrigger chunk preserves a fully readable static homepage`, async () => {
    let blocked = false;
    let failedRequest;
    await withPage(engine, async page => {
      await failedRequest;
      await waitMode(page, "static");
      assert.ok(blocked, "the actual ScrollTrigger chunk was intercepted");
      assert.equal(await page.locator("[data-home-story] .pin-spacer").count(), 0);
      assert.ok(await page.locator("#home-capabilities").isVisible());
      assert.equal(await page.locator("[data-home-section]").count(), 3);
    }, { setup: async page => {
      failedRequest = page.waitForEvent("requestfailed", { predicate: request => blocked && request.url().endsWith(".js") });
      await page.route("**/*.js", async route => {
        if (new URL(route.request().url()).origin !== server.baseURL) return route.abort();
        const response = await route.fetch();
        const body = await response.text();
        if (body.includes("scrollerProxy") && body.includes("anticipatePin")) {
          blocked = true;
          return route.abort();
        }
        return route.fulfill({ response, body });
      });
    } });
  });
}
