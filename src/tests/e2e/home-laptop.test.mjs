import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, webkit } from "playwright";
import { startTestServer } from "./helpers/test-server.mjs";
import { gotoFreshHomepage } from "./helpers/homepage-driver.mjs";

const engines = (process.env.QICORE_E2E_ENGINES || "chromium,webkit").split(",");
const browsers = new Map();
let server;
const artifacts = fileURLToPath(new URL("../../../.artifacts/home-laptop/", import.meta.url));
before(async () => {
  server = await startTestServer();
  await mkdir(artifacts, { recursive: true });
  for (const engine of engines) {
    if (!["chromium", "webkit"].includes(engine)) throw new Error("Unknown engine");
    browsers.set(engine, await ({ chromium, webkit }[engine]).launch(engine === "chromium" ? { channel: process.env.QICORE_E2E_CHROMIUM_CHANNEL || undefined } : {}));
  }
});
after(async () => {
  for (const browser of browsers.values()) await browser.close();
  await server?.stop();
});

async function withPage(engine, run, { viewport = { width: 1440, height: 900 }, reducedMotion = "no-preference", setup, cores = 12, memory = 8 } = {}) {
  const context = await browsers.get(engine).newContext({ viewport, reducedMotion, serviceWorkers: "block" });
  context.setDefaultTimeout(30000);
  await context.addInitScript(({ cores, memory }) => {
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => cores });
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => memory });
  }, { cores, memory });
  await context.route("**/*", route => {
    const request = route.request(), url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method()) || url.pathname.startsWith("/api/")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "laptop-mock" }) });
    }
    if (url.origin !== server.baseURL && url.protocol !== "blob:") return route.abort();
    return route.continue();
  });
  const page = await context.newPage(), errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !/Failed to load resource|net::ERR_FAILED|404 \(Not Found\)/.test(message.text())) errors.push(message.text());
  });
  try {
    await setup?.(page, context);
    await gotoFreshHomepage(page, server.baseURL);
    // Next dev indicator overlaps the real bottom-left player control.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await run(page);
    assert.deepEqual(errors, [], "no uncaught application errors");
  } finally { await context.close(); }
}

async function prepare(page) {
  await page.locator("[data-home-laptop-stage]").scrollIntoViewIfNeeded();
  await page.locator('[data-home-laptop-stage][data-laptop-mode="animated"]').waitFor();
  await page.waitForFunction(() => Number.isFinite(Number(document.querySelector("[data-home-laptop-stage]").dataset.laptopEnd)));
}
async function sample(page, progress) {
  await page.evaluate(progress => {
    const stage = document.querySelector("[data-home-laptop-stage]");
    const start = Number(stage.dataset.laptopStart), end = Number(stage.dataset.laptopEnd);
    scrollTo(0, start + (end - start) * progress);
  }, progress);
  await page.waitForFunction(progress => {
    const stage = document.querySelector("[data-home-laptop-stage]");
    return Math.abs(Number(stage.dataset.laptopProgress) - progress) < 0.001;
  }, progress);
  await page.waitForTimeout(500);
  return page.locator("[data-home-laptop-stage]").evaluate(stage => {
    const screen = stage.querySelector("[data-home-laptop-screen]"), rect = screen.getBoundingClientRect();
    return { progress: Number(stage.dataset.laptopProgress), lid: Number(stage.dataset.laptopLid), modelScale: Number(stage.dataset.laptopModelScale), modelBounds: JSON.parse(stage.dataset.laptopModelBounds), rotationX: Number(stage.dataset.laptopRotationX), rotationZ: Number(stage.dataset.laptopRotationZ), screen: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, transform: screen.style.transform, inert: screen.inert, facing: stage.dataset.laptopScreenFacing, paused: stage.querySelector("video").paused, phase: stage.dataset.laptopPhase };
  });
}

for (const engine of engines) {
  test(`${engine}: phone entry loads only the iPhone and keeps it in landscape`, async () => {
    const models = [];
    await withPage(engine, async page => {
      await prepare(page);
      assert.equal(await page.locator("[data-home-laptop-stage]").getAttribute("data-workspace-device"), "phone");
      await page.locator('[data-home-player="xgplayer"]').waitFor({ state: "attached" });
      const assertScreenAlignment = async () => {
        const layers = await page.locator("[data-home-laptop-screen]").evaluate(screen => {
          const bounds = screen.getBoundingClientRect();
          return [...screen.querySelectorAll("[data-home-video-presentation], [data-home-player-host], [data-home-workspace-video], .xgplayer-poster")].map(element => {
            const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
            return { name: element.tagName, dx: rect.x - bounds.x, dy: rect.y - bounds.y, dw: rect.width - bounds.width, dh: rect.height - bounds.height, fit: style.objectFit, backgroundSize: style.backgroundSize };
          });
        });
        for (const layer of layers) {
          for (const key of ["dx", "dy", "dw", "dh"]) assert.ok(Math.abs(layer[key]) < 1, JSON.stringify(layer));
          if (layer.name === "VIDEO") assert.equal(layer.fit, "cover");
          if (layer.name === "XG-POSTER") assert.equal(layer.backgroundSize, "cover");
        }
      };
      const entry = await sample(page, 0);
      const reserved = await page.locator("[data-home-laptop-stage]").evaluate(stage => {
        const title = stage.querySelector("[data-laptop-introduction]");
        const hint = stage.querySelector("[data-laptop-hint]");
        return { titleBottom: title.offsetTop + title.offsetHeight, hintTop: hint.offsetTop };
      });
      assert.ok(entry.modelBounds.top >= reserved.titleBottom + 23, JSON.stringify({ entry, reserved }));
      assert.ok(entry.modelBounds.bottom <= reserved.hintTop - 23, JSON.stringify({ entry, reserved }));
      await assertScreenAlignment();
      const forward = await sample(page, 0.55);
      await assertScreenAlignment();
      assert.equal(forward.facing, "true");
      assert.equal(forward.paused, true);
      const full = await sample(page, 1);
      assert.equal(full.inert, false);
      assert.ok(Math.abs(full.screen.width - 390) < 1 && Math.abs(full.screen.height - 844) < 1);
      const reverse = await sample(page, 0.55);
      await assertScreenAlignment();
      for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(reverse.screen[key] - forward.screen[key]) < 0.5);
      await page.setViewportSize({ width: 844, height: 390 });
      await prepare(page);
      const landscape = await sample(page, 0);
      assert.equal(await page.locator("[data-home-laptop-stage]").getAttribute("data-workspace-device"), "phone");
      assert.ok(landscape.modelBounds.left >= -1 && landscape.modelBounds.right <= 845);
      assert.ok(landscape.modelBounds.top >= -1 && landscape.modelBounds.bottom <= 391);
      assert.ok(models.some(path => path.endsWith("/apple_iphone_18_pro_max/scene.gltf")));
      assert.ok(!models.some(path => path.endsWith("/macbook_pro.glb")));
    }, { viewport: { width: 390, height: 844 }, setup: page => {
      page.on("request", request => {
        const path = new URL(request.url()).pathname;
        if (/\.(glb|gltf)$/.test(path)) models.push(path);
      });
    } });
  });

  test(`${engine}: short phone viewport reserves space for both localized titles`, async () => {
    await withPage(engine, async page => {
      await prepare(page);
      for (const locale of ["zh", "en"]) {
        if (await page.locator("html").getAttribute("data-locale") !== locale) await page.locator(".locale-toggle").click();
        const entry = await sample(page, 0);
        const space = await page.locator("[data-home-laptop-stage]").evaluate(stage => {
          const title = stage.querySelector("[data-laptop-introduction]");
          const hint = stage.querySelector("[data-laptop-hint]");
          return { top: title.offsetTop + title.offsetHeight, bottom: hint.offsetTop };
        });
        assert.ok(entry.modelBounds.top >= space.top + 23, JSON.stringify({ entry, space, locale }));
        assert.ok(entry.modelBounds.bottom <= space.bottom - 23, JSON.stringify({ entry, space, locale }));
      }
    }, { viewport: { width: 361, height: 594 } });
  });

  test(`${engine}: laptop opening stays clear of titles in desktop and tablet viewports`, async () => {
    await withPage(engine, async page => {
      await prepare(page);
      for (const [width, height] of [[1301, 765], [1440, 900], [1024, 768], [768, 1024]]) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(600);
        for (const locale of ["zh", "en"]) {
          if (await page.locator("html").getAttribute("data-locale") !== locale) await page.locator(".locale-toggle").click();
          for (const progress of [0, 0.1, 0.2, 0.3, 0.35]) {
            const state = await sample(page, progress);
            const space = await page.locator("[data-home-laptop-stage]").evaluate(stage => {
              const title = stage.querySelector("[data-laptop-introduction]");
              const hint = stage.querySelector("[data-laptop-hint]");
              return { top: title.offsetTop + title.offsetHeight, bottom: hint.offsetTop };
            });
            assert.ok(state.modelBounds.top >= space.top + 23, JSON.stringify({ state, space, width, height, locale }));
            assert.ok(state.modelBounds.bottom <= space.bottom - 23, JSON.stringify({ state, space, width, height, locale }));
          }
        }
      }
    });
  });

  test(`${engine}: real HTML screen follows a reversible calibrated laptop timeline`, async () => {
    await withPage(engine, async page => {
      const video = await page.locator("[data-home-workspace-video]").elementHandle();
      await prepare(page);
      const forward = new Map();
      for (const progress of [0, 0.1, 0.35, 0.55, 0.85, 1]) {
        const state = await sample(page, progress);
        forward.set(progress, state);
        if (progress < 1) assert.equal(state.paused, true, "video never autoplays early");
        if (progress <= 0.1) { assert.equal(state.lid, 0); assert.equal(state.rotationX, 0); assert.equal(state.rotationZ, 0); }
        await page.screenshot({ path: `${artifacts}/${engine}-desktop-${progress}.png` });
      }
      await page.locator('[data-home-player="xgplayer"]').waitFor({ state: "attached" });
      assert.equal(await video.evaluate(video => video.controls), false, "native controls are replaced by xgplayer");
      assert.equal(await page.locator("[data-home-player-host] .xgplayer-controls").count(), 1);
      const full = forward.get(1).screen;
      assert.ok(Math.abs(full.x) < 1 && Math.abs(full.y) < 1);
      assert.ok(Math.abs(full.width - 1440) < 1 && Math.abs(full.height - 900) < 1);
      assert.equal(forward.get(1).inert, false);
      assert.equal(await page.locator("[data-home-laptop-screen] #home-workspace").count(), 0);
      const videoBox = await video.boundingBox();
      assert.ok(Math.abs(videoBox.x) < 1 && Math.abs(videoBox.y) < 1);
      assert.ok(Math.abs(videoBox.width - 1440) < 1 && Math.abs(videoBox.height - 900) < 1);
      assert.ok((await page.locator("[data-home-workspace-copy]").boundingBox()).y >= 899);
      assert.equal(await video.evaluate(video => getComputedStyle(video).objectFit), "cover");
      assert.equal(forward.get(0.55).facing, "true");
      await page.locator('[data-home-video-state="playing"]').waitFor();
      const time = await video.evaluate(video => video.currentTime);
      for (const progress of [0.85, 0.55, 0.35, 0.1, 0]) {
        const reverse = await sample(page, progress);
        assert.ok(Math.abs(reverse.lid - forward.get(progress).lid) < 0.1);
        for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(reverse.screen[key] - forward.get(progress).screen[key]) < 0.5);
        assert.equal(reverse.paused, true);
      }
      assert.ok(await video.evaluate((video, time) => video.currentTime >= time && document.querySelector("[data-home-workspace-video]") === video, time));
      await sample(page, 1);
      await page.locator('[data-home-video-state="playing"]').waitFor();
      await page.locator("[data-home-player-host]").hover();
      await page.locator("[data-home-video-toggle]").click();
      await sample(page, 0.85);
      await sample(page, 1);
      assert.ok(await video.evaluate(video => video.paused), "manual pause survives reverse scroll");
      await page.evaluate(() => {
        const stage = document.querySelector("[data-home-laptop-stage]");
        scrollTo(0, Number(stage.dataset.laptopEnd) + innerHeight + 400);
      });
      assert.ok((await page.locator("[data-home-laptop-screen]").boundingBox()).y < -250, "HTML joins document flow after unpin");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    });
  });

  test(`${engine}: laptop is the second chapter and the third screen stays static`, async () => {
    await withPage(engine, async page => {
      const order = await page.locator("[data-home-section='capabilities'] [data-home-chapter]").evaluateAll(nodes => nodes.map(node => node.dataset.homeChapter));
      assert.deepEqual(order.slice(0, 2), ["workspace", "introduction"]);
      await prepare(page);
      const closed = await sample(page, 0);
      assert.equal(closed.lid, 0);
      assert.equal(closed.modelScale, 13);
      assert.equal(closed.rotationX, 0);
      assert.equal(closed.rotationZ, 0);
      assert.equal(closed.facing, "false");
      assert.equal(await page.locator("[data-home-laptop-screen]").evaluate(el => getComputedStyle(el).visibility), "hidden");
      assert.equal(await page.locator("[data-home-laptop-screen]").evaluate(el => getComputedStyle(el).opacity), "0", "player descendants cannot bleed through the closed lid");
      const positions = await page.evaluate(() => {
        const laptop = document.querySelector("[data-home-laptop-stage]");
        const image = document.querySelector("[data-home-intro-static]");
        return { start: Number(laptop.dataset.laptopStart), end: Number(laptop.dataset.laptopEnd), cover: Number(laptop.dataset.laptopCover), image: image.getBoundingClientRect().top + scrollY };
      });
      // The workspace rises over the frozen carousel, so the pose timeline starts
      // within a short scroll from the top instead of a full viewport down.
      assert.ok(positions.cover > 0 && positions.cover <= 900 * 0.5, `cover rise stays within half a viewport: ${positions.cover}`);
      assert.ok(Math.abs(positions.start - positions.cover) <= 1, "the MacBook pose begins as soon as the cover rise finishes");
      assert.ok(positions.image > positions.end, "image follows the full laptop pin and its normal-flow copy without a blank viewport");
      await page.screenshot({ path: `${artifacts}/${engine}-second-screen-closed.png` });
      await sample(page, 1);
      const image = page.locator("[data-home-intro-static] img");
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
      assert.equal(await image.evaluate(el => el.closest(".pin-spacer") === null), true);
      const before = await image.evaluate(el => getComputedStyle(el).transform);
      await image.hover();
      await page.waitForTimeout(260);
      assert.notEqual(await image.evaluate(el => getComputedStyle(el).transform), before, "hover scales the static product image");
      await page.mouse.move(0, 0);
      await page.waitForTimeout(560);
      assert.equal(await image.evaluate(el => getComputedStyle(el).transform), before);
      await page.screenshot({ path: `${artifacts}/${engine}-third-screen-image-hover.png` });
      const reverse = await sample(page, 0);
      assert.equal(reverse.lid, 0);
      assert.equal(reverse.rotationX, 0);
      assert.equal(reverse.rotationZ, 0);
    });
  });

  test(`${engine}: five responsive viewports and both locales reach exact fullscreen`, async () => {
    await withPage(engine, async page => {
      await prepare(page);
      for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(600);
        const device = width < 768 || (width < 1024 && height <= 500) ? "phone" : "laptop";
        await page.locator(`[data-home-laptop-stage][data-workspace-device="${device}"][data-laptop-mode="animated"]`).waitFor();
        await prepare(page);
        for (const progress of [0, 0.35]) {
          const model = await sample(page, progress);
          assert.equal(model.modelScale, 13);
          assert.ok(model.modelBounds.left >= -1 && model.modelBounds.right <= width + 1, JSON.stringify(model));
          assert.ok(model.modelBounds.top >= -1 && model.modelBounds.bottom <= height + 1, JSON.stringify(model));
          await page.screenshot({ path: `${artifacts}/${engine}-larger-model-${width}x${height}-${progress}.png` });
        }
        for (const locale of ["zh", "en"]) {
          if (await page.locator("html").getAttribute("data-locale") !== locale) await page.locator(".locale-toggle").click();
          await page.waitForTimeout(150);
          await sample(page, 0.55);
          const full = await sample(page, 1);
          assert.ok(Math.abs(full.screen.x) < 1 && Math.abs(full.screen.y) < 1, JSON.stringify(full));
          assert.ok(Math.abs(full.screen.width - width) < 1 && Math.abs(full.screen.height - height) < 1);
          const videoBox = await page.locator("[data-home-workspace-video]").boundingBox();
          assert.ok(Math.abs(videoBox.x) < 1 && Math.abs(videoBox.y) < 1);
          assert.ok(Math.abs(videoBox.width - width) < 1 && Math.abs(videoBox.height - height) < 1);
          assert.ok((await page.locator("[data-home-workspace-copy]").boundingBox()).y >= height - 1);
          const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, offenders: [...document.querySelectorAll("[data-home-chapter], .pin-spacer, [data-home-intro-static], [data-home-player-host]")].map(el => ({ name: el.dataset.homeChapter || el.className, width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })).filter(el => el.right > innerWidth + 1) }));
          assert.ok(overflow.scrollWidth <= width + 1, JSON.stringify(overflow));
          assert.ok(await page.locator("[data-home-video-toggle]").evaluate(el => el.getBoundingClientRect().height >= 44));
          await page.screenshot({ path: `${artifacts}/${engine}-${width}x${height}-${locale}.png` });
        }
      }
    });
  });

  test(`${engine}: xgplayer controls keep locale, seek, playback gating and autoplay rejection safe`, async () => {
    await withPage(engine, async page => {
      await prepare(page);
      await page.locator('[data-home-player="xgplayer"]').waitFor({ state: "attached" });
      await sample(page, 0.55);
      assert.ok(await page.locator("[data-home-workspace-video]").evaluate(video => video.paused));
      assert.equal(await page.locator("[data-home-player-host]").evaluate(host => host.inert), true);
      await sample(page, 1);
      await page.locator('[data-home-video-state="blocked"]').waitFor();
      assert.equal(await page.evaluate(() => window.homePlayAttempts), 1);
      await page.evaluate(() => { window.rejectHomePlay = false; });
      const play = page.locator("[data-home-player-host] [data-home-video-toggle]");
      await page.locator("[data-home-player-host]").hover();
      await play.click();
      await page.locator('[data-home-video-state="playing"]').waitFor();
      await play.click();
      await page.locator('[data-home-video-state="paused"]').waitFor();
      await page.locator(".locale-toggle").click();
      assert.equal(await play.getAttribute("aria-label"), "Play demo");
      await page.locator("[data-home-player-host]").focus();
      await play.focus();
      await page.keyboard.press("Enter");
      await page.locator('[data-home-video-state="playing"]').waitFor();
      const video = await page.locator("[data-home-workspace-video]").elementHandle();
      await video.evaluate(video => { video.currentTime = 4; });
      await sample(page, 0.85);
      assert.ok(await video.evaluate(video => video.paused && video.currentTime >= 4));
      await sample(page, 1);
      await page.locator('[data-home-video-state="playing"]').waitFor();
      await page.locator("[data-home-player-host] .xgplayer-volume").click();
      assert.equal(await video.evaluate(video => video.muted), false);
      assert.equal(await page.locator("[data-home-player-host] .xgplayer-fullscreen").count(), 1);
      assert.equal(await page.locator("[data-home-player-host] .xgplayer-playbackrate").count(), 1);
      await page.screenshot({ path: `${artifacts}/${engine}-xgplayer-controls.png` });
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

  test(`${engine}: xgplayer native fullscreen stays active and keeps playing`, async () => {
    await withPage(engine, async page => {
      await prepare(page);
      await sample(page, 1);
      await page.locator('[data-home-player="xgplayer"]').waitFor({ state: "attached" });
      await page.locator('[data-home-video-state="playing"]').waitFor();
      const video = await page.locator("[data-home-workspace-video]").elementHandle();
      const before = await video.evaluate(video => video.currentTime);
      await page.evaluate(() => {
        window.homeFullscreenEvents = [];
        document.addEventListener("fullscreenchange", () => window.homeFullscreenEvents.push({ active: Boolean(document.fullscreenElement), at: performance.now() }));
      });
      await page.locator("[data-home-player-host]").hover();
      await page.locator("[data-home-player-host] .xgplayer-fullscreen").click();
      await page.waitForTimeout(1800);
      const state = await page.evaluate(() => ({
        active: Boolean(document.fullscreenElement),
        events: window.homeFullscreenEvents,
        paused: document.querySelector("[data-home-workspace-video]").paused,
        progress: document.querySelector("[data-home-laptop-stage]").dataset.laptopProgress,
      }));
      assert.equal(state.active, true, JSON.stringify(state));
      assert.equal(state.paused, false, JSON.stringify(state));
      assert.ok(await video.evaluate((video, before) => video.currentTime !== before, before));
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.evaluate(() => window.dispatchEvent(new Event("resize")));
      await page.waitForTimeout(900);
      assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), true, "pin refresh must not eject native fullscreen");
      const box = await video.boundingBox();
      const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      assert.ok(Math.abs(box.x) < 1 && Math.abs(box.y) < 1, JSON.stringify(box));
      const layers = await page.evaluate(() => [...document.querySelectorAll("[data-home-chapter='workspace'], [data-home-laptop-stage], [data-home-laptop-screen], [data-home-player-host], [data-home-workspace-video]")].map(el => ({ tag: el.tagName, className: el.className, rect: { width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, y: el.getBoundingClientRect().y }, style: el.getAttribute("style") })));
      assert.ok(Math.abs(box.width - viewport.width) < 1 && Math.abs(box.height - viewport.height) < 1, JSON.stringify({ box, viewport, layers }));
      await page.screenshot({ path: `${artifacts}/${engine}-native-fullscreen.png` });
      await page.evaluate(() => document.exitFullscreen());
      await page.waitForFunction(() => document.fullscreenElement === null);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(600);
      await sample(page, 0.85);
      assert.ok(await video.evaluate(video => video.paused));
    });
  });

  test(`${engine}: reduced motion, low capabilities, resource and WebGL failures stay readable`, async () => {
    for (const options of [
      { reducedMotion: "reduce" }, { cores: 2 }, { memory: 2 },
      { setup: page => page.route("**/macbook_pro.glb", route => route.abort()) },
      { viewport: { width: 390, height: 844 }, setup: page => page.route("**/apple_iphone_18_pro_max/scene.gltf", route => route.abort()) },
      { setup: (_page, context) => context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/.test(type) ? null : original.call(this, type, ...args); };
      }) },
    ]) {
      await withPage(engine, async page => {
        await page.locator("[data-home-laptop-stage]").scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);
        assert.equal(await page.locator("[data-home-laptop-stage]").getAttribute("data-laptop-mode"), "static");
        assert.ok(await page.locator("[data-home-workspace-copy] #home-workspace").count() === 1);
        assert.ok(await page.locator("[data-home-video-toggle]").isEnabled());
        assert.equal(await page.locator("[data-home-laptop-stage]").evaluate(stage => stage.closest(".pin-spacer") !== null), false);
      }, options);
    }
  });

  test(`${engine}: cached navigation and runtime reduced-motion changes clean up only this scene`, async () => {
    await withPage(engine, async page => {
      await prepare(page);
      await sample(page, 1);
      await page.locator('[data-site-header] nav a[href="/about"]').click();
      await page.waitForURL("**/about");
      await page.locator('[data-site-header] nav a[href="/"]').click();
      await page.waitForURL(server.baseURL + "/");
      await prepare(page);
      await sample(page, 1);
      assert.equal(await page.locator("[data-home-laptop-stage]").count(), 1);
      assert.equal(await page.locator("[data-home-laptop-stage]").evaluate(stage => stage.closest(".pin-spacer") !== null), true);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator('[data-home-laptop-stage][data-laptop-mode="static"]').waitFor();
      assert.equal(await page.locator("[data-home-laptop-screen]").evaluate(el => el.inert), false);
      assert.ok(await page.locator("[data-home-workspace-video]").evaluate(video => video.paused));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await prepare(page);
      await sample(page, 0.35);
    });
  });
}
