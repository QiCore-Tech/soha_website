import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { startTestServer } from "./helpers/test-server.mjs";

test("mobile header is compact with accessible controls and unchanged desktop sizing", async () => {
  const server = await startTestServer();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    for (const route of ["/", "/news", "/about", "/oyscat"]) {
      await page.goto(server.baseURL + route, { waitUntil: "domcontentloaded" });
      const header = page.locator('[data-header-ready="true"]');
      await header.waitFor();
      for (const width of [320, 390, 430, 767, 768, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        const rect = await header.boundingBox();
        assert.equal(rect.height, width < 768 ? 52 : 76, `${route} at ${width}px`);
        assert.equal(rect.y, 0);
        assert.equal(rect.width, width);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        for (const selector of width < 768 ? ['.locale-toggle', '.marketing-menu-toggle'] : ['.locale-toggle']) {
          const control = await header.locator(selector).boundingBox();
          assert.ok(control.height >= 44 && control.width >= 44);
        }
        if (width < 768) {
          await header.locator('.marketing-menu-toggle').tap();
          const menu = header.locator('nav');
          await menu.waitFor({ state: 'visible' });
          assert.equal((await menu.boundingBox()).y, rect.height);
          await page.keyboard.press('Escape');
          await menu.waitFor({ state: 'hidden' });
        }
      }
    }
  } finally {
    await browser.close();
    await server.stop();
  }
});

test("browser safe-area reports do not add a blank band above mobile controls", async () => {
  const server = await startTestServer();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    // Model a browser reporting 36px despite placing its toolbar above the page.
    // Desktop device emulation otherwise always reports zero safe-area insets.
    await page.route('**/_next/static/css/**', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace(/env\(safe-area-inset-top(?:,\s*0px)?\)/g, '36px') });
    });
    await page.goto(server.baseURL, { waitUntil: "domcontentloaded" });
    const header = page.locator('[data-header-ready="true"]');
    await header.waitFor();
    assert.match(await page.locator('meta[name="viewport"]').getAttribute('content'), /viewport-fit=auto/);
    for (const y of [0, 300, 0]) {
      await page.evaluate(y => scrollTo(0, y), y);
      await page.waitForFunction(scrolled => document.querySelector('[data-site-header]').hasAttribute('data-home-scrolled') === scrolled, y > 0);
      assert.equal((await header.boundingBox()).height, 52);
      assert.equal((await header.boundingBox()).y, 0);
      assert.equal(await header.evaluate(el => getComputedStyle(el).paddingTop), '4px');
      assert.equal((await header.locator('.marketing-menu-toggle').boundingBox()).y, 4);
    }
    await header.locator('.marketing-menu-toggle').tap();
    const menu = header.locator('nav');
    await menu.waitFor({ state: 'visible' });
    assert.equal((await menu.boundingBox()).y, 52);
    await menu.locator('a[href="/about"]').tap();
    await page.waitForURL('**/about');
    assert.equal((await header.boundingBox()).height, 52);
  } finally {
    await browser.close();
    await server.stop();
  }
});
