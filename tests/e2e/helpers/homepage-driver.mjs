import assert from "node:assert/strict";

const GRID_SIZE = 40;
const VOXEL_STORAGE_KEY = "qicore-voxel-layout-v1";

export async function gotoFreshHomepage(page, baseURL) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("#grid-plane").waitFor();
  await page.waitForFunction(() => Boolean(window.__QICORE_LEGACY_INITED__));
  await page.evaluate((storageKey) => {
    window.localStorage.removeItem(storageKey);
  }, VOXEL_STORAGE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#grid-plane").waitFor();
  await page.waitForFunction(() => Boolean(window.__QICORE_LEGACY_INITED__));
}

export async function getGridPoint(page, x, y) {
  const box = await page.locator("#grid-plane").boundingBox();
  assert.ok(box, "grid plane should be visible");

  return {
    x: box.x + x * GRID_SIZE + GRID_SIZE / 2,
    y: box.y + y * GRID_SIZE + GRID_SIZE / 2,
  };
}

export async function clickGridCell(page, x, y, button = "left") {
  const point = await getGridPoint(page, x, y);
  await page.mouse.click(point.x, point.y, { button });
}

export async function placeVoxelAtGrid(page, x, y) {
  await clickGridCell(page, x, y, "left");
  await page.waitForTimeout(100);
}

export async function placeVoxelOnTopOfLast(page) {
  const face = page.locator("#voxels-container .voxel").last().locator(".face.top");
  const box = await face.boundingBox();
  assert.ok(box, "top face should exist");

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "left" });
  await page.waitForTimeout(100);
}

export async function rightClickLastVoxel(page) {
  const face = page.locator("#voxels-container .voxel").last().locator(".face.top");
  const box = await face.boundingBox();
  assert.ok(box, "voxel top face should exist");

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });
  await page.waitForTimeout(100);
}

export async function openPaletteOnGrid(page, x, y) {
  await clickGridCell(page, x, y, "right");
  await waitForPaletteOpen(page);
}

export async function openPaletteOnFrame(page) {
  await page.mouse.click(24, 24, { button: "right" });
  await waitForPaletteOpen(page);
}

export async function holdRightClickOnGrid(page, x, y, durationMs = 1300) {
  const point = await getGridPoint(page, x, y);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down({ button: "right" });
  await page.waitForTimeout(durationMs);
  await page.mouse.up({ button: "right" });
}

export async function selectPaletteColor(page, colorKey) {
  const target = page.locator(`#cursor-cube [data-color-key="${colorKey}"]`);
  await target.click();
  await waitForPaletteClosed(page);
}

export async function waitForPaletteOpen(page) {
  await page.waitForFunction(() => document.getElementById("cursor-cube")?.classList.contains("is-palette-mode"));
}

export async function waitForPaletteClosed(page) {
  await page.waitForFunction(() => !document.getElementById("cursor-cube")?.classList.contains("is-palette-mode"));
}

export async function closePaletteWithBackdrop(page) {
  await page.locator("#palette-backdrop").click({ force: true });
  await waitForPaletteClosed(page);
}

export async function getStoredVoxels(page) {
  return page.evaluate((storageKey) => JSON.parse(window.localStorage.getItem(storageKey) || "[]"), VOXEL_STORAGE_KEY);
}

export async function getVoxelCount(page) {
  return page.locator("#voxels-container .voxel").count();
}

export async function getCursorSelectedColor(page) {
  return page.evaluate(() => document.getElementById("cursor-cube")?.style.getPropertyValue("--selected-color") || "");
}

export async function getLastVoxelFaceBackground(page, faceName) {
  return page.locator("#voxels-container .voxel").last().locator(`.face.${faceName}`).evaluate((el) => getComputedStyle(el).backgroundColor);
}
