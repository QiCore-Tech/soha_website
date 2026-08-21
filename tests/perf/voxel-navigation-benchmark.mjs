import { performance } from "node:perf_hooks";
import { chromium } from "playwright";

import { startTestServer } from "../e2e/helpers/test-server.mjs";

const CPU_THROTTLE_RATE = Number(process.env.QICORE_PERF_CPU_RATE || 4);
const SAMPLE_MS = Number(process.env.QICORE_PERF_SAMPLE_MS || 2200);
const RUNS = Number(process.env.QICORE_PERF_RUNS || 2);
const VOXEL_COUNTS = (process.env.QICORE_PERF_VOXELS || "0,300,800,1500,2500")
  .split(",")
  .map(Number)
  .filter(Number.isFinite);

const colors = ["top", "front", "right", "left", "back", "bottom", "white", "black"];

function createVoxels(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    x: index % 30,
    y: Math.floor(index / 30) % 19,
    z: Math.floor(index / (30 * 19)),
    sx: 1,
    sy: 1,
    sz: 1,
    colorKey: colors[index % colors.length],
  }));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(runs) {
  return Object.fromEntries(
    Object.keys(runs[0]).map((key) => [key, average(runs.map((run) => run[key]))])
  );
}

async function sampleNavigation(browser, baseURL, voxelCount) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    const state = {
      frameGaps: [],
      longTasks: [],
      startedAt: performance.now(),
    };
    window.__QICORE_VOXEL_NAV_BENCH__ = state;

    let lastFrameAt = performance.now();
    function sampleFrame(now) {
      state.frameGaps.push(Math.max(0, now - lastFrameAt));
      lastFrameAt = now;
      requestAnimationFrame(sampleFrame);
    }
    requestAnimationFrame(sampleFrame);

    try {
      new PerformanceObserver((list) => {
        state.longTasks.push(...list.getEntries().map((entry) => entry.duration));
      }).observe({ type: "longtask", buffered: true });
    } catch (error) {}
  });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");

  await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  await page.evaluate((layout) => {
    window.localStorage.setItem("qicore-voxel-layout-v1", JSON.stringify(layout));
  }, createVoxels(voxelCount));

  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE_RATE });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__QICORE_LEGACY_INITED__ === true, undefined, { timeout: 60000 });

  const renderedBeforeNavigation = await page.locator("#voxels-container .voxel").count();
  if (renderedBeforeNavigation !== voxelCount) {
    throw new Error(`Expected ${voxelCount} voxels before navigation, found ${renderedBeforeNavigation}`);
  }

  const startedAt = performance.now();
  await page.locator('.marketing-nav-links a[href="/about"]').click({
    force: true,
    noWaitAfter: true,
    timeout: 60000,
  });
  await page.waitForURL("**/about", { waitUntil: "domcontentloaded" });
  const clickToDOMContentLoadedMs = performance.now() - startedAt;
  await page.waitForTimeout(SAMPLE_MS);

  const browserMetrics = await page.evaluate(() => {
    const state = window.__QICORE_VOXEL_NAV_BENCH__;
    const gaps = state?.frameGaps || [];
    const longTasks = state?.longTasks || [];
    return {
      voxelCount: document.querySelectorAll("#voxels-container .voxel").length,
      domNodeCount: document.querySelectorAll("*").length,
      worstFrameMs: gaps.length ? Math.max(...gaps) : 0,
      framesOver32Ms: gaps.filter((gap) => gap > 32).length,
      estimatedMissedFrames: gaps.reduce(
        (total, gap) => total + Math.max(0, Math.round(gap / 16.67) - 1),
        0
      ),
      longTaskCount: longTasks.length,
      longTaskTotalMs: longTasks.reduce((sum, duration) => sum + duration, 0),
      jsHeapUsedBytes: performance.memory?.usedJSHeapSize || 0,
    };
  });
  const cdpMetrics = Object.fromEntries(
    (await cdp.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value])
  );

  await context.close();
  return {
    clickToDOMContentLoadedMs,
    ...browserMetrics,
    cdpNodeCount: cdpMetrics.Nodes || 0,
  };
}

const configuredBaseURL = process.env.QICORE_PERF_BASE_URL;
const server = configuredBaseURL
  ? { baseURL: configuredBaseURL, stop: async () => {} }
  : await startTestServer();
const browser = await chromium.launch({ headless: true });

try {
  const warmupPage = await browser.newPage();
  await warmupPage.goto(`${server.baseURL}/`, { waitUntil: "networkidle" });
  await warmupPage.goto(`${server.baseURL}/about`, { waitUntil: "networkidle" });
  await warmupPage.close();

  const scenarios = {};
  for (const voxelCount of VOXEL_COUNTS) {
    const runs = [];
    for (let run = 0; run < RUNS; run += 1) {
      process.stderr.write(`Sampling ${voxelCount} voxels (${run + 1}/${RUNS})\n`);
      const sample = await sampleNavigation(browser, server.baseURL, voxelCount);
      process.stderr.write(`${JSON.stringify(sample)}\n`);
      runs.push(sample);
    }
    scenarios[voxelCount] = summarize(runs);
  }

  process.stdout.write(`${JSON.stringify({
    settings: {
      cpuThrottleRate: CPU_THROTTLE_RATE,
      sampleMs: SAMPLE_MS,
      runs: RUNS,
    },
    scenarios,
  }, null, 2)}\n`);
} finally {
  await browser.close();
  await server.stop();
}
