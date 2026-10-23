import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, webkit } from "playwright";
import { startTestServer } from "./helpers/test-server.mjs";

let server;
const browsers = new Map();
before(async () => {
  server = await startTestServer({ mode: "static" });
});
after(async () => {
  for (const browser of browsers.values()) await browser.close();
  if (server) await server.stop();
});

async function withPage(engine, viewport, run, locale) {
  if (!browsers.has(engine)) browsers.set(engine, await engine.launch({ headless: true, ...(engine === chromium && process.env.QICORE_E2E_CHROMIUM_CHANNEL ? { channel: process.env.QICORE_E2E_CHROMIUM_CHANNEL } : {}) }));
  const context = await browsers.get(engine).newContext({ viewport, reducedMotion: "reduce", serviceWorkers: "block" });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(30000);
  const writes = [];
  // Every form/API write is fulfilled in-memory. External reads are blocked too.
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method()) || url.pathname.startsWith("/api/")) {
      writes.push({ method: request.method(), path: url.pathname });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "smoke-mock", token: "smoke-token" }) });
    }
    if (url.origin !== server.baseURL) return route.abort();
    return route.continue();
  });
  if (locale) await context.addInitScript((value) => {
    if (localStorage.getItem("qicore-locale") === null) localStorage.setItem("qicore-locale", value);
  }, locale);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource|net::ERR_FAILED|404 \(Not Found\)/.test(message.text())) {
      errors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.url().startsWith(`${server.baseURL}/`) && response.status() >= 400 &&
        !response.url().includes("/missing/static/deep-link")) {
      errors.push(`Local HTTP ${response.status()}: ${response.url()}`);
    }
  });
  try {
    await run(page, writes);
    assert.deepEqual(errors, [], "No uncaught browser errors");
  } finally {
    await context.close();
  }
}

test("static artifacts serve direct deep links, reloads and genuine 404 responses", async () => {
  await withPage(chromium, { width: 1440, height: 900 }, async (page) => {
    for (const pathname of ["/about", "/news", "/careers", "/relax"]) {
      const response = await page.goto(`${server.baseURL}${pathname}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, pathname);
      assert.equal(response.headers()["x-qicore-preview"], "static-readonly");
      assert.ok((await page.locator("body").innerText()).trim().length > 0, pathname);
      assert.equal((await page.reload({ waitUntil: "networkidle" })).status(), 200, pathname);
    }
    for (const pathname of ["/oyscat", "/team", "/style-lab"]) {
      const response = await page.goto(`${server.baseURL}${pathname}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 404, pathname);
    }
    const missing = await page.goto(`${server.baseURL}/missing/static/deep-link`, { waitUntil: "networkidle" });
    assert.equal(missing.status(), 404);
    assert.match(await page.locator("body").innerText(), /404|not found/i);
    assert.equal(await page.locator("[data-home-carousel]").count(), 0);
  });
});

for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
  test(`${name} saved English applies before hydration on a static deep link`, async () => {
    await withPage(engine, { width: 1440, height: 900 }, async (page) => {
      await page.route("**/*.js", (route) => route.abort());
      const response = await page.goto(`${server.baseURL}/about`, { waitUntil: "domcontentloaded" });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator("html").getAttribute("data-locale"), "en");
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
    }, "en");
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
    test(`${name} static homepage smoke ${viewport.width}x${viewport.height}`, async () => {
      await withPage(engine, viewport, async (page) => {
        await page.goto(server.baseURL, { waitUntil: "networkidle" });
        await page.locator("[data-home-carousel] .swiper-initialized").waitFor();
        // Hidden slides are lazy-loaded: visit every slide instead of requiring eager downloads.
        for (const index of [0, 1]) {
          await page.locator('[data-carousel-pagination] button').nth(index).click();
          await page.waitForFunction(value => Number(document.querySelector("[data-home-carousel]").dataset.activeSlide) === value, index);
          await page.locator(".swiper-slide-active img").evaluate(image => image.decode());
        }
        await page.locator('[data-carousel-pagination] button').first().click();
        await page.waitForFunction(() => document.querySelector("[data-home-carousel]").dataset.activeSlide === "0");
        await page.evaluate(() => scrollTo(0, 0));
        const bounds = await page.locator("[data-home-carousel]").boundingBox();
        assert.ok(bounds.width >= viewport.width - 2);
        assert.ok(bounds.height >= viewport.height - 2);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "No horizontal overflow");
        assert.equal(await page.locator("canvas, #grid-plane").count(), 0);
        await page.locator(".locale-toggle").click();
        await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
        assert.deepEqual(await page.locator("[data-home-section]").evaluateAll(nodes => nodes.map(node => node.dataset.homeSection)), ["capabilities", "news"]);
        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        await page.mouse.wheel(0, 40);
        await page.waitForFunction(() => scrollY > 0 && scrollY < 200);
        await page.mouse.wheel(0, 120);
        await page.waitForFunction(() => scrollY > 100 && scrollY < 400);
        await page.locator("[data-home-page] .marketing-footer").scrollIntoViewIfNeeded();
        await page.waitForFunction(() => scrollY > innerHeight);
        await page.locator("[data-home-scrolled]").waitFor();
        assert.equal(await page.locator("[data-site-header]").evaluate(el => getComputedStyle(el).backgroundColor), "rgb(242, 241, 236)");
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
        const firstImage = page.locator("[data-home-section] img[data-alt-zh]").first();
        assert.equal(await firstImage.getAttribute("alt"), await firstImage.getAttribute("data-alt-en"));
        assert.match(await firstImage.getAttribute("alt"), /QiCore/);
        const menu = page.getByRole("button", { name: /Toggle navigation/ });
        if (await menu.isVisible()) await menu.click();
        await page.locator('.marketing-nav-links a[href="/about"]').click();
        await page.waitForURL("**/about");
        await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(await page.locator("html").getAttribute("data-locale"), "en");
      });
    });
  }

  test(`${name} blocked storage and browser history keep language usable`, async () => {
    await withPage(engine, { width: 1440, height: 900 }, async (page) => {
      await page.addInitScript(() => {
        Storage.prototype.getItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
        Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
      });
      await page.goto(server.baseURL, { waitUntil: "networkidle" });
      await page.locator(".locale-toggle").click();
      await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
      await page.locator('.marketing-nav-links a[href="/about"]').click();
      await page.waitForURL("**/about");
      await page.goBack();
      await page.waitForURL(server.baseURL + "/");
      assert.equal(await page.locator("html").getAttribute("data-locale"), "en");
      await page.goForward();
      await page.waitForURL("**/about");
      assert.equal(await page.locator("html").getAttribute("data-locale"), "en");
      await page.locator(".locale-toggle").click();
      await page.waitForFunction(() => document.documentElement.dataset.locale === "zh");
    });
  });

  test(`${name} saved language and localized navigation`, async () => {
    await withPage(engine, { width: 1440, height: 900 }, async (page) => {
      await page.goto(`${server.baseURL}/about`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      assert.match(await page.title(), /About|QiCore/i);
      // html[data-locale] is initialized before React; wait for the hydrated toggle too.
      await page.waitForFunction(() => document.querySelector(".locale-toggle")?.getAttribute("aria-label") === "Switch to Chinese");
      assert.equal(await page.locator(".locale-toggle").getAttribute("aria-label"), "Switch to Chinese");
      await page.locator(".locale-toggle").click();
      await page.waitForFunction(() => document.documentElement.dataset.locale === "zh");
      assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
      await page.waitForFunction(() => document.querySelector(".locale-toggle")?.getAttribute("aria-label") === "切换为英文");
      assert.equal(await page.locator(".locale-toggle").getAttribute("aria-label"), "切换为英文");
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator("html").getAttribute("data-locale"), "zh");
    }, "en");
  });
}
