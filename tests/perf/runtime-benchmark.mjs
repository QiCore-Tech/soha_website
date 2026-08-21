import { chromium } from "playwright";

import { startTestServer } from "../e2e/helpers/test-server.mjs";

const CPU_THROTTLE_RATE = Number(process.env.QICORE_PERF_CPU_RATE || 6);
const SAMPLE_MS = Number(process.env.QICORE_PERF_SAMPLE_MS || 3000);
const RUNS = Number(process.env.QICORE_PERF_RUNS || 3);

const metricNames = [
  "TaskDuration",
  "ScriptDuration",
  "LayoutDuration",
  "RecalcStyleDuration",
  "LayoutCount",
  "RecalcStyleCount",
  "JSHeapUsedSize",
  "Nodes",
];

function toMetricMap(metrics) {
  return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(runs) {
  const result = {};
  for (const key of Object.keys(runs[0])) {
    result[key] = average(runs.map((run) => run[key]));
  }
  return result;
}

async function sampleRoute(browser, baseURL, route) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE_RATE });

  await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const before = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  const qicoreStateBefore = await page.evaluate(() => ({
    renderFrames: window.__QICORE_PERF__?.renderFrames || 0,
    lowPowerMode: window.__QICORE_PERF__?.lowPowerMode ? 1 : 0,
  }));
  const frameSample = await page.evaluate(async (sampleMs) => {
    const startedAt = performance.now();
    let lastFrameAt = startedAt;
    let frames = 0;
    let droppedFrames = 0;
    let worstFrameMs = 0;

    await new Promise((resolve) => {
      function tick(now) {
        const frameMs = now - lastFrameAt;
        lastFrameAt = now;
        frames += 1;
        worstFrameMs = Math.max(worstFrameMs, frameMs);
        if (frameMs > 34) droppedFrames += 1;
        if (now - startedAt >= sampleMs) resolve();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });

    const elapsedMs = performance.now() - startedAt;
    return {
      elapsedMs,
      fps: frames / (elapsedMs / 1000),
      droppedFrameRatio: frames ? droppedFrames / frames : 0,
      worstFrameMs,
      resourceTransferBytes: performance
        .getEntriesByType("resource")
        .reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
    };
  }, SAMPLE_MS);
  const after = toMetricMap((await cdp.send("Performance.getMetrics")).metrics);
  const qicoreFramesAfter = await page.evaluate(() => window.__QICORE_PERF__?.renderFrames || 0);

  const sample = {
    fps: frameSample.fps,
    droppedFrameRatio: frameSample.droppedFrameRatio,
    worstFrameMs: frameSample.worstFrameMs,
    resourceTransferBytes: frameSample.resourceTransferBytes,
    qicoreRenderFrames: qicoreFramesAfter - qicoreStateBefore.renderFrames,
    qicoreLowPowerMode: qicoreStateBefore.lowPowerMode,
  };

  for (const name of metricNames) {
    if (name === "JSHeapUsedSize" || name === "Nodes") sample[name] = after[name] || 0;
    else sample[name] = (after[name] || 0) - (before[name] || 0);
  }

  await context.close();
  return sample;
}

const server = await startTestServer();
const browser = await chromium.launch({ headless: true });

try {
  const result = {
    settings: { cpuThrottleRate: CPU_THROTTLE_RATE, sampleMs: SAMPLE_MS, runs: RUNS },
    routes: {},
  };

  for (const route of ["/", "/about"]) {
    const runs = [];
    for (let index = 0; index < RUNS; index += 1) {
      runs.push(await sampleRoute(browser, server.baseURL, route));
    }
    result.routes[route] = summarize(runs);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await browser.close();
  await server.stop();
}
