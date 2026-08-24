import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

import {
  getCursorSelectedColor,
  getLastVoxelFaceBackground,
  getStoredVoxels,
  getVoxelCount,
  isSystemCursorVisible,
  gotoFreshHomepage,
  holdRightClickOnGrid,
  openPaletteOnFrame,
  openPaletteOnGrid,
  placeVoxelAtGrid,
  placeVoxelOnTopOfLast,
  rightClickLastVoxel,
  selectPaletteColor,
  waitForPaletteClosed,
} from "./helpers/homepage-driver.mjs";
import { startTestServer } from "./helpers/test-server.mjs";

let browser;
let server;

async function withPage(run) {
  const context = await browser.newContext({
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

test("right click opens palette on blank canvas", async () => {
  await withPage(async (page) => {
    await openPaletteOnGrid(page, 3, 3);
    assert.equal(await isSystemCursorVisible(page), true);
  });
});

test("right click opens palette on the outer black frame", async () => {
  await withPage(async (page) => {
    await openPaletteOnFrame(page);
  });
});

test("floating navigation is isolated from the voxel palette", async () => {
  await withPage(async (page) => {
    const navBox = await page.locator(".marketing-nav").boundingBox();
    assert.ok(navBox, "floating navigation should be visible");
    await page.mouse.click(navBox.x + navBox.width / 2, navBox.y + navBox.height / 2, { button: "right" });
    await page.waitForTimeout(200);
    assert.equal(await page.locator("#palette-overlay.is-active").count(), 0);
  });
});

test("right clicking a placed voxel deletes it instead of opening the palette", async () => {
  await withPage(async (page) => {
    await placeVoxelAtGrid(page, 5, 5);
    assert.equal(await getVoxelCount(page), 1);

    await rightClickLastVoxel(page);

    assert.equal(await getVoxelCount(page), 0);
    const stored = await getStoredVoxels(page);
    assert.equal(stored.length, 0);
    await waitForPaletteClosed(page);
  });
});

test("solid color selection updates cursor state and the next placed voxel", async () => {
  await withPage(async (page) => {
    await openPaletteOnGrid(page, 2, 2);
    await selectPaletteColor(page, "black");

    assert.equal(await getCursorSelectedColor(page), "#3A3D40");

    await placeVoxelAtGrid(page, 6, 6);

    const stored = await getStoredVoxels(page);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].colorKey, "black");

    const topBg = await getLastVoxelFaceBackground(page, "top");
    const frontBg = await getLastVoxelFaceBackground(page, "front");
    assert.equal(topBg, "rgb(58, 61, 64)");
    assert.equal(frontBg, "rgb(58, 61, 64)");
  });
});

test("clicking the same top face stacks upward instead of duplicating the same space", async () => {
  await withPage(async (page) => {
    await placeVoxelAtGrid(page, 5, 5);
    await placeVoxelOnTopOfLast(page);
    await placeVoxelOnTopOfLast(page);

    const stored = await getStoredVoxels(page);
    assert.equal(stored.length, 3);
    assert.deepEqual(
      stored.map(({ x, y, z, sx, sy, sz }) => ({ x, y, z, sx, sy, sz })),
      [
        { x: 5, y: 5, z: 0, sx: 1, sy: 1, sz: 1 },
        { x: 5, y: 5, z: 1, sx: 1, sy: 1, sz: 1 },
        { x: 5, y: 5, z: 2, sx: 1, sy: 1, sz: 1 },
      ],
    );
  });
});

test("voxel layout persists after reload", async () => {
  await withPage(async (page) => {
    await placeVoxelAtGrid(page, 4, 4);
    await placeVoxelOnTopOfLast(page);

    await page.reload({ waitUntil: "networkidle" });

    assert.equal(await getVoxelCount(page), 2);
    const stored = await getStoredVoxels(page);
    assert.equal(stored.length, 2);
    assert.deepEqual(
      stored.map(({ x, y, z }) => ({ x, y, z })),
      [
        { x: 4, y: 4, z: 0 },
        { x: 4, y: 4, z: 1 },
      ],
    );
  });
});

test("right long press clears the canvas", async () => {
  await withPage(async (page) => {
    await placeVoxelAtGrid(page, 4, 4);
    await placeVoxelAtGrid(page, 5, 4);
    assert.equal(await getVoxelCount(page), 2);

    await holdRightClickOnGrid(page, 2, 2, 1300);
    await page.waitForTimeout(750);

    assert.equal(await getVoxelCount(page), 0);
    const stored = await getStoredVoxels(page);
    assert.equal(stored.length, 0);
  });
});

test("OysCat gateway transitions to the independent product site", async () => {
  await withPage(async (page) => {
    const gatewayBox = await page.locator("#btn-trigger").boundingBox();
    assert.ok(gatewayBox, "OysCat gateway should be visible");
    await page.mouse.click(gatewayBox.x + gatewayBox.width / 2, gatewayBox.y + gatewayBox.height / 2);
    await page.waitForURL("**/oyscat");
    assert.equal(await page.locator(".oyscat-product-page").count(), 1);
  });
});

test("mobile navigation reaches OysCat content pages", async () => {
  await withPage(async (page) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.locator(".marketing-menu-toggle").click();
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.locator(".locale-toggle").click();
    await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
    assert.equal(await page.getByRole("heading", { name: "Make Physical Products by Simply Describing What You Want" }).isVisible(), true);
  });
});

test("saved English locale is applied before hydration", async () => {
  const context = await browser.newContext({
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
    assert.equal(await page.getByRole("heading", { name: "Make Physical Products by Simply Describing What You Want" }).isVisible(), true);
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
      /Make Physical Products by Simply Describing What You Want/,
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

    await page.locator('.marketing-nav-links a[href="/team"]').click();
    await page.waitForURL("**/team");
    const teamArt = page.locator(".qicore-route-panel.is-active .themed-hero-art");
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

    const story = page.locator(".qicore-route-panel.is-active .news-entry");
    assert.equal(await story.getAttribute("open"), null);
    await story.locator("summary").click();
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
    assert.match(await player.getAttribute("src"), /youtube-nocookie\.com\/embed\/lqwWjw_-WnY/);
    assert.match(page.url(), /\/about$/);

    await page.locator(".qicore-film-close").click();
    assert.equal(await player.count(), 0);
    assert.equal(await page.locator(".qicore-film-poster").count(), 1);

    await page.locator(".qicore-film-poster").click();
    await page.keyboard.press("Escape");
    assert.equal(await player.count(), 0);
  });
});

test("saved voxels stay mounted across company navigation", async () => {
  await withPage(async (page) => {
    await placeVoxelAtGrid(page, 4, 4);
    assert.equal(await getVoxelCount(page), 1);
    await page.evaluate(() => {
      window.__QICORE_VOXEL_NODE_PROBE__ = document.querySelector("#voxels-container .voxel");
    });

    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");

    assert.equal(await page.locator("#voxels-container .voxel").count(), 1);
    assert.equal(
      await page.evaluate(() => window.__QICORE_VOXEL_NODE_PROBE__ === document.querySelector("#voxels-container .voxel")),
      true,
      "the rendered voxel node must survive company navigation"
    );
  });
});

test("returning home hides the title before hydration", async () => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  try {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("qicore-route-entry", JSON.stringify({
        kind: "to-home",
        target: "/",
        at: Date.now(),
      }));
    });
    await page.route("**/*.js", (route) => route.abort());
    await page.goto(`${server.baseURL}/`, { waitUntil: "domcontentloaded" });

    assert.equal(await page.locator("html").getAttribute("data-qicore-route-entry"), "to-home");
    assert.equal(await page.locator(".content-layer").evaluate((element) => getComputedStyle(element).opacity), "0");
    const returningNavBox = await page.locator(".marketing-nav").boundingBox();
    assert.ok(returningNavBox && returningNavBox.y < 30, "returning navigation should start at the top");
  } finally {
    await context.close();
  }
});

test("company navigation preserves the shared canvas while product navigation requests HTML", async () => {
  await withPage(async (page) => {
    const routeDataRequests = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith(".txt")) routeDataRequests.push(request.url());
    });
    await page.evaluate(() => {
      window.__QICORE_CANVAS_NODE_PROBE__ = document.getElementById("canvas-area");
    });
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");

    assert.equal(
      await page.evaluate(() => window.__QICORE_CANVAS_NODE_PROBE__ === document.getElementById("canvas-area")),
      true,
      "the shared QiCore canvas must survive company navigation"
    );
    assert.equal(await page.evaluate(() => document.contentType), "text/html");
    assert.deepEqual(routeDataRequests, [], "QiCore navigation must not request static RSC .txt files");

    await page.goBack();
    await page.waitForURL(`${server.baseURL}/`);
    assert.equal(
      await page.evaluate(() => window.__QICORE_CANVAS_NODE_PROBE__ === document.getElementById("canvas-area")),
      true,
      "browser history must preserve the shared canvas"
    );
    await page.goForward();
    await page.waitForURL(`${server.baseURL}/about`);
    await page.waitForFunction(() => document.querySelector(".qicore-route-panel.is-active h1"));
    assert.match(
      await page.locator(".qicore-route-panel.is-active h1").textContent(),
      /Make Physical Products by Simply Describing What You Want/
    );

    await page.evaluate(() => {
      document.documentElement.dataset.navigationDocumentProbe = "stale-company-page";
    });
    await page.locator('.marketing-nav-links a[href="/oyscat"]').click();
    await page.waitForURL("**/oyscat");

    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.navigationDocumentProbe ?? null),
      null,
      "the QiCore document must not survive the product-site navigation"
    );
    assert.equal(await page.evaluate(() => document.contentType), "text/html");
  });
});

test("returning from a company page keeps an interactive voxel homepage", async () => {
  await withPage(async (page) => {
    await page.goto(`${server.baseURL}/about`);
    await page.locator('.marketing-nav-links a[href="/"]').click();
    await page.waitForURL(`${server.baseURL}/`);
    await page.waitForFunction(() => document.querySelector(".qicore-route-shell")?.classList.contains("is-returning-home"));
    assert.equal(
      await page.locator(".content-layer").evaluate((element) => getComputedStyle(element).animationName),
      "qicore-home-content-return"
    );
    await placeVoxelAtGrid(page, 4, 4);
    assert.equal(await getVoxelCount(page), 1);
  });
});

test.todo("side-plane drag should create wall patches on voxel faces");
