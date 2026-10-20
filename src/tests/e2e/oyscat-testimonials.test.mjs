import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { startTestServer } from "./helpers/test-server.mjs";

let browser;
let server;
const rootSelector = ".qicore-route-panel.is-active [data-testimonials] [data-logo-loop]";
const trackSelector = `${rootSelector} [data-logo-loop-track]`;
const panelSelector = ".qicore-route-panel.is-active [data-review-panel]:not([hidden])";

before(async () => {
  server = await startTestServer();
  browser = await chromium.launch({
    headless: process.env.QICORE_E2E_HEADED !== "1",
    channel: process.env.QICORE_E2E_CHROMIUM_CHANNEL || undefined,
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await server.stop();
});

async function withPage(options, run) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    serviceWorkers: "block",
    ...options,
  });
  await context.route("**/*", route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method()) || url.pathname.startsWith("/api/")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    return url.origin === server.baseURL ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  try {
    await page.goto(`${server.baseURL}/oyscat`, { waitUntil: "networkidle" });
    await run(page);
  } finally {
    await context.close();
  }
}

async function settleRoute(page) {
  await page.waitForFunction(() => document.querySelector(".qicore-route-content")?.classList.contains("is-idle"));
}

async function revealLoop(page) {
  await settleRoute(page);
  await page.locator(rootSelector).scrollIntoViewIfNeeded();
  assert.equal(await page.locator(`${rootSelector} [data-review-trigger]`).count(), 29);
  assert.equal(await page.locator(`${rootSelector} [data-logo-loop-sequence]`).count(), 1);
  assert.deepEqual(await page.locator(rootSelector).evaluate(root => [
    getComputedStyle(root, "::before").content,
    getComputedStyle(root, "::after").content,
  ]), ["none", "none"], "Maker avatars must not have edge fade overlays");
  await page.waitForFunction(selector => {
    const root = document.querySelector(selector);
    return root && !root.closest("[data-qicore-waterfall]")?.getAnimations().some(animation => animation.playState === "running");
  }, rootSelector);
}

async function moveAway(page) {
  await page.mouse.move(1, 1);
}

async function clickOutside(page) {
  await page.locator(".qicore-route-panel.is-active #makers-title").click();
  await assertNoSelection(page);
}

async function assertNoSelection(page) {
  assert.equal(await page.locator(`${rootSelector} [data-selected="true"]`).count(), 0);
  assert.equal(await page.locator(`${rootSelector} [aria-pressed="true"]`).count(), 0);
}

async function assertSelectionMatchesFocus(page) {
  const states = await page.locator(`${rootSelector} [data-review-trigger]`).evaluateAll(nodes => nodes.map(node => ({
    selected: node.dataset.selected,
    pressed: node.getAttribute("aria-pressed"),
    focused: node === document.activeElement,
  })));
  for (const state of states) {
    assert.equal(state.selected, state.pressed);
    if (state.selected === "true") assert.equal(state.focused, true);
  }
}

async function assertMoving(page) {
  const before = await page.locator(trackSelector).evaluate(track => track.style.transform);
  await page.waitForFunction(({ selector, before }) => {
    const track = document.querySelector(selector);
    return track?.dataset.paused === "false" && track.style.transform !== before;
  }, { selector: trackSelector, before });
}

async function assertPaused(page, duration = 250) {
  await page.waitForFunction(selector => document.querySelector(selector)?.dataset.paused === "true", trackSelector);
  const before = await page.locator(trackSelector).evaluate(track => track.style.transform);
  await page.waitForTimeout(duration);
  assert.equal(await page.locator(trackSelector).evaluate(track => track.style.transform), before);
}

async function focusMaker(page, id) {
  const trigger = page.locator(`${rootSelector} [data-logo-loop-sequence]`).first().locator(`[data-review-id="${id}"]`).first();
  await trigger.evaluate(node => {
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    node.focus({ preventScroll: true });
  });
  return trigger;
}

async function assertSingleSelection(page, trigger) {
  assert.equal(await page.locator(`${rootSelector} [data-selected="true"]`).count(), 1);
  assert.equal(await page.locator(`${rootSelector} [aria-pressed="true"]`).count(), 1);
  assert.equal(await trigger.getAttribute("data-selected"), "true");
  assert.equal(await trigger.getAttribute("aria-pressed"), "true");
  const states = await page.locator(`${rootSelector} [data-review-trigger]`).evaluateAll(nodes => nodes.map(node => ({
    selected: node.dataset.selected,
    pressed: node.getAttribute("aria-pressed"),
  })));
  for (const state of states) assert.equal(state.selected, state.pressed);
}

async function assertReviews(page) {
  const ids = ["lin", "sheng", "chen", "alvarez", "zhou", "sato"];
  const quotes = new Set();
  assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "lin");
  await assertNoSelection(page);
  for (const id of ids) {
    const trigger = await focusMaker(page, id);
    await trigger.click();
    assert.equal(await page.locator(panelSelector).count(), 1);
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), id);
    quotes.add(await page.locator(`${panelSelector} blockquote`).innerText());
    await assertSingleSelection(page, trigger);
  }
  assert.equal(quotes.size, ids.length);

  const duplicate = page.locator(`${rootSelector} [data-review-id="sheng"]`).nth(1);
  await duplicate.evaluate(node => {
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    node.focus({ preventScroll: true });
  });
  await duplicate.click();
  assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "sheng");
  await assertSingleSelection(page, duplicate);
  await duplicate.evaluate(node => {
    node.dataset.reviewId = "unknown";
    node.click();
    node.dataset.reviewId = "sheng";
  });
  assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "sheng");
}

test("direct Oyscat entry pauses on hover and selection and switches all six maker reviews", async () => {
  await withPage({}, async page => {
    await revealLoop(page);
    await moveAway(page);
    await assertMoving(page);
    await page.locator(rootSelector).hover();
    await assertPaused(page);
    await assertNoSelection(page);
    await moveAway(page);
    await assertMoving(page);
    await page.locator(rootSelector).hover();
    await assertPaused(page);
    await assertReviews(page);
    await moveAway(page);
    await assertPaused(page, 4250);
    await clickOutside(page);
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "sheng");
    await assertMoving(page);
    await page.locator(".locale-toggle").click();
    await page.waitForFunction(() => document.documentElement.dataset.locale === "en");
    await assertReviewsInEnglish(page);
  });
});

test("blurring a maker clears its selected appearance without hiding its review", async () => {
  await withPage({}, async page => {
    await revealLoop(page);
    await assertNoSelection(page);
    const trigger = await focusMaker(page, "chen");
    await trigger.click();
    await assertSingleSelection(page, trigger);
    await assertPaused(page);
    await trigger.evaluate(node => node.blur());
    await assertNoSelection(page);
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "chen");
    await assertPaused(page);
    await moveAway(page);
    await assertMoving(page);
  });
});

async function assertReviewsInEnglish(page) {
  await page.locator(rootSelector).hover();
  await (await focusMaker(page, "alvarez")).click();
  assert.match(await page.locator(panelSelector).innerText(), /Product designer/);
  assert.match(await page.locator(`${rootSelector} [data-review-id="alvarez"]`).first().getAttribute("aria-label"), /view testimonial/);
}

test("keyboard focus pauses across avatars and resumes only after focus leaves", async () => {
  await withPage({}, async page => {
    await revealLoop(page);
    await page.locator(rootSelector).hover();
    const first = await focusMaker(page, "lin");
    await first.click();
    await moveAway(page);
    await assertPaused(page);
    await page.keyboard.press("Tab");
    await assertPaused(page);
    await assertNoSelection(page);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "sheng");
    await page.keyboard.press("Tab");
    await assertPaused(page);
    await page.keyboard.press("Space");
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "chen");
    await page.locator(rootSelector).hover();
    await moveAway(page);
    await assertPaused(page);
    for (let index = 0; index < 27; index += 1) await page.keyboard.press("Tab");
    await assertNoSelection(page);
    await assertMoving(page);
  });
});

test("cached Oyscat HTML keeps hover, click-to-pause and keyboard interactions", async () => {
  await withPage({}, async page => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await settleRoute(page);
    await page.locator('.marketing-nav-links a[href="/oyscat"]').click();
    await page.waitForURL("**/oyscat");
    await revealLoop(page);
    await moveAway(page);
    await assertMoving(page);
    await page.locator(rootSelector).hover();
    await assertPaused(page);
    await assertReviews(page);
    await (await focusMaker(page, "lin")).click();
    await moveAway(page);
    await assertPaused(page);
    await clickOutside(page);
    await assertMoving(page);
    await focusMaker(page, "lin");
    await page.keyboard.press("Tab");
    await assertPaused(page);
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "sheng");
  });
});

test("touch selection pauses until an outside tap and reduced motion stays still", async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, async page => {
    await revealLoop(page);
    await page.locator(`${rootSelector} [data-review-id="sheng"]`).first().tap();
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "sheng");
    await assertPaused(page);
    await page.locator(".qicore-route-panel.is-active #makers-title").tap();
    await assertNoSelection(page);
    await assertMoving(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(selector => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(selector)).transform).m41 === 0, trackSelector);
    const before = await page.locator(trackSelector).evaluate(track => track.style.transform);
    await page.waitForTimeout(250);
    assert.equal(await page.locator(trackSelector).evaluate(track => track.style.transform), before);
    await page.locator(`${rootSelector} [data-review-id="chen"]`).first().tap();
    assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "chen");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await assertPaused(page);
    await page.locator(".qicore-route-panel.is-active #makers-title").tap();
    await assertNoSelection(page);
    await assertMoving(page);
  });
});

async function assertMouseDragging(page) {
  await revealLoop(page);
  const selected = await focusMaker(page, "lin");
  await selected.click();
  const bounds = await page.locator(rootSelector).boundingBox();
  assert.ok(bounds);
  const x = bounds.x + bounds.width * 0.55;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  assert.equal(await page.evaluate(({ x, y }) => getComputedStyle(document.elementFromPoint(x, y)).cursor, { x, y }), "grab");
  const original = await page.locator(trackSelector).evaluate(track => track.style.transform);
  await page.mouse.down();
  await assertSelectionMatchesFocus(page);
  await page.mouse.move(x - 140, y, { steps: 8 });
  assert.equal(await page.locator(rootSelector).getAttribute("data-dragging"), "true");
  assert.equal(await page.locator(rootSelector).evaluate(root => getComputedStyle(root).cursor), "grabbing");
  assert.equal(await selected.evaluate(node => getComputedStyle(node).cursor), "grabbing");
  const left = await page.locator(trackSelector).evaluate(track => track.style.transform);
  assert.notEqual(left, original);
  await assertPaused(page);
  await assertSelectionMatchesFocus(page);
  await page.mouse.move(x, y, { steps: 8 });
  assert.notEqual(await page.locator(trackSelector).evaluate(track => track.style.transform), left);
  await page.mouse.up();
  assert.equal(await page.locator(rootSelector).getAttribute("data-dragging"), null);
  assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "lin");
  await assertSelectionMatchesFocus(page);
  await assertPaused(page);
  await (await focusMaker(page, "chen")).click();
  assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "chen");
  await moveAway(page);
  await assertPaused(page);
  await clickOutside(page);
  await assertMoving(page);

  await page.locator(rootSelector).scrollIntoViewIfNeeded();
  const nextBounds = await page.locator(rootSelector).boundingBox();
  assert.ok(nextBounds);
  const nextY = nextBounds.y + nextBounds.height / 2;
  await page.mouse.move(nextBounds.x + nextBounds.width * 0.55, nextY);
  await page.mouse.down();
  await page.mouse.move(nextBounds.x + nextBounds.width + 30, nextY, { steps: 8 });
  await page.mouse.up();
  assert.equal(await page.locator(rootSelector).getAttribute("data-dragging"), null);
  assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "chen");
  await clickOutside(page);
  await assertMoving(page);
}

test("mouse dragging in both directions keeps the selection and suppresses release clicks", async () => {
  await withPage({}, async page => {
    await assertMouseDragging(page);
  });
});

test("the maker strip stays at 29 icons after resizing and dragging to either end", async () => {
  await withPage({ reducedMotion: "reduce" }, async page => {
    await revealLoop(page);
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await revealLoop(page);
      const last = page.locator(`${rootSelector} [data-review-trigger]`).last();
      await last.evaluate(node => {
        node.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
        node.focus({ preventScroll: true });
      });
      await last.click();
      await assertSingleSelection(page, last);
      assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "zhou");
      const geometry = await page.locator(rootSelector).evaluate(root => {
        const track = root.querySelector("[data-logo-loop-track]");
        const sequence = root.querySelector("[data-logo-loop-sequence]");
        return { offset: -new DOMMatrixReadOnly(track.style.transform).m41, max: Math.max(0, sequence.offsetWidth - root.clientWidth) };
      });
      assert.ok(geometry.offset >= 0 && geometry.offset <= geometry.max + 1);
      assert.equal(await page.locator(`${rootSelector} [data-review-trigger]`).count(), 29);
    }
  });
});

test("cached Oyscat HTML supports dragging without changing the selected maker", async () => {
  await withPage({}, async page => {
    await page.locator('.marketing-nav-links a[href="/about"]').click();
    await page.waitForURL("**/about");
    await settleRoute(page);
    await page.locator('.marketing-nav-links a[href="/oyscat"]').click();
    await page.waitForURL("**/oyscat");
    await assertMouseDragging(page);
  });
});

test("touch dragging works with reduced motion while vertical gestures still scroll the page", async () => {
  await withPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" }, async page => {
    await revealLoop(page);
    const bounds = await page.locator(rootSelector).boundingBox();
    assert.ok(bounds);
    const session = await page.context().newCDPSession(page);
    const x = bounds.x + bounds.width * 0.65;
    const y = bounds.y + bounds.height / 2;
    const touch = async (type, px, py) => session.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x: px, y: py, id: 1 }],
    });
    try {
      const original = await page.locator(trackSelector).evaluate(track => track.style.transform);
      await touch("touchStart", x, y);
      await touch("touchMove", x - 25, y);
      await touch("touchMove", x - 90, y);
      assert.equal(await page.locator(rootSelector).getAttribute("data-dragging"), "true");
      await touch("touchEnd");
      assert.notEqual(await page.locator(trackSelector).evaluate(track => track.style.transform), original);
      assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "lin");
      await assertNoSelection(page);
      assert.equal(await page.locator(rootSelector).getAttribute("data-dragging"), null);

      const scrollY = await page.evaluate(() => window.scrollY);
      await touch("touchStart", x, y);
      await touch("touchMove", x, y - 30);
      await touch("touchMove", x, y - 130);
      await touch("touchEnd");
      await page.waitForFunction(before => window.scrollY > before, scrollY);
      assert.equal(await page.locator(rootSelector).getAttribute("data-dragging"), null);
      assert.equal(await page.locator(panelSelector).getAttribute("data-review-panel"), "lin");
    } finally {
      await session.detach();
    }
  });
});
