import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

import {
  getCursorSelectedColor,
  getLastVoxelFaceBackground,
  getStoredVoxels,
  getVoxelCount,
  gotoFreshHomepage,
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
  });
});

test("right click opens palette on the outer black frame", async () => {
  await withPage(async (page) => {
    await openPaletteOnFrame(page);
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

test.todo("side-plane drag should create wall patches on voxel faces");
