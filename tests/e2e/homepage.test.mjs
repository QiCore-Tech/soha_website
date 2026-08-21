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
    assert.equal(await page.getByRole("heading", { name: "Make intelligent hardware easier to create." }).isVisible(), true);
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
    assert.equal(await page.getByRole("heading", { name: "Make intelligent hardware easier to create." }).isVisible(), true);
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

test("document navigation restores the waterfall entry animation", async () => {
  await withPage(async (page) => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.waitForFunction(() => {
      const item = document.querySelector('[data-qicore-waterfall="0"]');
      return item && getComputedStyle(item).animationName === "qicore-waterfall-arrive";
    });

    assert.equal(
      await page.locator('[data-qicore-waterfall="0"]').evaluate((element) => getComputedStyle(element).animationName),
      "qicore-waterfall-arrive"
    );

    await page.locator('.marketing-nav-links a[href="/news"]').click();
    await page.waitForURL("**/news");
    await page.waitForFunction(() => {
      const item = document.querySelector('[data-qicore-waterfall="0"]');
      return item && getComputedStyle(item).animationName === "qicore-waterfall-arrive";
    });

    assert.equal(
      await page.locator('[data-qicore-waterfall="0"]').evaluate((element) => getComputedStyle(element).animationName),
      "qicore-waterfall-arrive"
    );
  });
});

test("saved voxels use the canvas presentation without hydration errors", async () => {
  await withPage(async (page) => {
    await placeVoxelAtGrid(page, 4, 4);
    assert.equal(await getVoxelCount(page), 1);

    const hydrationErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /hydration|server rendered html/i.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      if (/hydration|server rendered html/i.test(error.message)) hydrationErrors.push(error.message);
    });

    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.waitForFunction(() => window.__QICORE_VOXEL_BUILD_READY__ === true);

    assert.equal(await page.locator("#voxels-container .voxel").count(), 0);
    assert.equal(await page.locator("html").getAttribute("data-qicore-voxel-mode"), "presentation");
    assert.equal(
      await page.locator("#voxel-presentation-canvas").evaluate((canvas) => {
        const context = canvas.getContext("2d");
        return context.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
      }),
      true
    );
    assert.deepEqual(hydrationErrors, []);
  });
});

test("the saved voxel canvas is available before external scripts", async () => {
  await withPage(async (page) => {
    await placeVoxelAtGrid(page, 4, 4);
    assert.equal(await getVoxelCount(page), 1);

    await page.route("**/*.js", (route) => route.abort());
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await page.waitForLoadState("domcontentloaded");

    assert.equal(await page.locator("#voxels-container .voxel").count(), 0);
    assert.equal(
      await page.locator("#voxel-presentation-canvas").evaluate((canvas) => {
        const context = canvas.getContext("2d");
        return context.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
      }),
      true
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

test("company navigation requests a fresh HTML document", async () => {
  await withPage(async (page) => {
    await page.evaluate(() => {
      document.documentElement.dataset.navigationDocumentProbe = "stale-page";
    });
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");

    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.navigationDocumentProbe ?? null),
      null,
      "the previous document must not survive navigation"
    );
    assert.equal(await page.evaluate(() => document.contentType), "text/html");

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

test("returning from a company page reloads an interactive voxel homepage", async () => {
  await withPage(async (page) => {
    await page.goto(`${server.baseURL}/about`);
    await page.locator('.marketing-nav-links a[href="/"]').click();
    await page.waitForURL(`${server.baseURL}/`);
    await page.waitForFunction(() => document.querySelector(".qicore-route-shell")?.classList.contains("is-returning-home"));
    assert.equal(
      await page.locator(".content-layer").evaluate((element) => getComputedStyle(element).animationName),
      "qicore-home-content-return"
    );
    await page.waitForFunction(() => window.__QICORE_VOXEL_BUILD_READY__ === true);
    await placeVoxelAtGrid(page, 4, 4);
    assert.equal(await getVoxelCount(page), 1);
  });
});

test.todo("side-plane drag should create wall patches on voxel faces");
