import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../features/home/lib/home-laptop-motion.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module, exports: module.exports });
const { LAPTOP_MODEL_SCALE, LAPTOP_SHOWCASE_ZOOM, LAPTOP_COVER_UNITS, laptopEntryCameraOffset, getLaptopPose, getPhonePose, getWorkspaceDevice, screenFitDistance, screenProjectionMatrix, expandScreenQuad, canEnhanceLaptop, laptopScrollDistance, laptopScrollUnits, laptopCoverDistance, laptopPinDistance } = module.exports;

test("workspace selects the phone by viewport dimensions including phone landscape", () => {
  for (const [width, height] of [[390, 844], [844, 390], [767, 1024], [932, 430]]) {
    assert.equal(getWorkspaceDevice(width, height), "phone");
  }
  for (const [width, height] of [[768, 1024], [1024, 768], [1440, 900], [1024, 500]]) {
    assert.equal(getWorkspaceDevice(width, height), "laptop");
  }
});

test("phone turns upright without a lid and retains the reversible fullscreen handoff", () => {
  assert.deepEqual(Array.from(getPhonePose(0.55).rotation), [0, 0, 0]);
  for (const progress of [0, 0.1, 0.35, 0.55, 0.85, 1]) {
    const phone = getPhonePose(progress), laptop = getLaptopPose(progress);
    assert.equal(phone.lidAngle, 105);
    for (const key of ["progress", "push", "handoff", "sceneOpacity", "complete"]) {
      assert.equal(phone[key], laptop[key]);
    }
    for (const axis of [0, 1, 2]) {
      assert.ok(Math.abs(phone.rotation[axis] - getPhonePose(progress - 1e-7).rotation[axis]) < 0.001);
      assert.ok(Math.abs(phone.rotation[axis] - getPhonePose(progress + 1e-7).rotation[axis]) < 0.001);
    }
  }
});

test("staged laptop poses are continuous, bounded and identical in reverse", () => {
  for (const p of [0, 0.1, 0.35, 0.55, 0.85, 1]) {
    const a = getLaptopPose(p);
    assert.ok(a.lidAngle >= 0 && a.lidAngle <= 105);
    for (const key of ["lidAngle", "positionY", "sceneOpacity", "handoff", "push"]) {
      assert.ok(Math.abs(a[key] - getLaptopPose(p - 1e-7)[key]) < 0.001);
      assert.ok(Math.abs(a[key] - getLaptopPose(p + 1e-7)[key]) < 0.001);
    }
    assert.equal(JSON.stringify(a), JSON.stringify(getLaptopPose(p)));
  }
  assert.equal(getLaptopPose(-1).lidAngle, 0);
  assert.equal(getLaptopPose(0.35).lidAngle, 105);
  assert.equal(getLaptopPose(NaN).progress, 0);
  assert.equal(getLaptopPose(2).sceneOpacity, 0);
  assert.equal(getLaptopPose(0.99999).complete, false);
  assert.equal(getLaptopPose(1).complete, true);
});

test("laptop starts flat with the lid fully closed and returns to that pose", () => {
  for (const progress of [-1, 0, 0.05, 0.1]) {
    const pose = getLaptopPose(progress);
    assert.equal(pose.lidAngle, 0);
    assert.equal(pose.rotation[0], 0, "base has no pitch");
    assert.equal(pose.rotation[2], 0, "base has no roll");
  }
  assert.ok(Math.abs(getLaptopPose(0.225).lidAngle - 52.5) < 1e-10);
  assert.equal(getLaptopPose(0.35).lidAngle, 105);
  assert.equal(getLaptopPose(0).lidAngle, 0);
});

test("screen fit handles portrait, landscape and desktop without cropping", () => {
  const tangent = Math.tan(38 * Math.PI / 360);
  for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900]]) {
    const d = screenFitDistance(2.86, 1.8, width / height, 38);
    assert.ok(2.86 / (2 * d * tangent * width / height) <= 0.95000001);
    assert.ok(1.8 / (2 * d * tangent) <= 0.95000001);
  }
  assert.throws(() => screenFitDistance(0, 1, 1, 38));
});

test("CSS homography projects all four HTML corners and handoff ends at viewport", () => {
  const original = [{ x: 210, y: 150 }, { x: 800, y: 190 }, { x: 900, y: 620 }, { x: 140, y: 650 }];
  for (const p of [0, 0.2, 0.5, 1]) {
    const quad = expandScreenQuad(original, 390, 844, p);
    const matrix = screenProjectionMatrix(quad, 1280, 803);
    assert.ok(matrix);
    [[0, 0], [1280, 0], [1280, 803], [0, 803]].forEach(([x, y], index) => {
      const w = matrix[3] * x + matrix[7] * y + matrix[15];
      assert.ok(Math.abs((matrix[0] * x + matrix[4] * y + matrix[12]) / w - quad[index].x) < 1e-7);
      assert.ok(Math.abs((matrix[1] * x + matrix[5] * y + matrix[13]) / w - quad[index].y) < 1e-7);
    });
  }
  assert.equal(JSON.stringify(expandScreenQuad(original, 390, 844, 1)), JSON.stringify([{ x: 0, y: 0 }, { x: 390, y: 0 }, { x: 390, y: 844 }, { x: 0, y: 844 }]));
  assert.equal(screenProjectionMatrix(original, 0, 803), null);
});

test("touch devices and unknown capabilities are not assumed low performance", () => {
  const allowed = { reducedMotion: false, saveData: false };
  assert.equal(canEnhanceLaptop(allowed), true);
  assert.equal(canEnhanceLaptop({ ...allowed, cores: 4, memory: 4 }), true);
  for (const change of [{ cores: 2 }, { memory: 2 }, { reducedMotion: true }, { saveData: true }]) {
    assert.equal(canEnhanceLaptop({ ...allowed, ...change }), false);
  }
  assert.equal(laptopScrollDistance(1440, 900), 3600);
  assert.equal(laptopScrollDistance(768, 1024), 3584);
  assert.equal(laptopScrollDistance(390, 844), 2532);
});

test("the cover rise stays short enough for a slight scroll to swap the screens", () => {
  assert.equal(LAPTOP_COVER_UNITS, 0.4);
  for (const [width, height] of [[1440, 900], [1024, 768], [844, 390]]) {
    const cover = laptopCoverDistance(height);
    assert.equal(cover, Math.round(height * 0.4));
    assert.ok(cover <= height * 0.5, "cover completes within half a viewport");
    assert.equal(laptopPinDistance(width, height), cover + laptopScrollDistance(width, height));
    assert.ok(Math.abs(laptopScrollDistance(width, height) - laptopScrollUnits(width) * height) <= 1);
  }
});

test("the larger laptop uses 30 percent more model scale without changing its pose", () => {
  assert.equal(LAPTOP_SHOWCASE_ZOOM, 1.3);
  assert.equal(LAPTOP_MODEL_SCALE, 13);
  assert.equal(getLaptopPose(0).lidAngle, 0);
  assert.equal(getLaptopPose(0).rotation[1], -0.32);
});

test("entry camera clearance keeps the enlarged model inside portrait and landscape views", () => {
  const points = [{ x: -2.2, y: -1.5, z: -4.5 }, { x: 2.2, y: 1.5, z: -5.5 }];
  const tangent = Math.tan(38 * Math.PI / 360);
  for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 900]]) {
    const aspect = width / height;
    const extra = laptopEntryCameraOffset(points, aspect, 38);
    assert.ok(extra >= 0);
    for (const point of points) {
      const depth = -point.z + extra;
      assert.ok(Math.abs(point.x) / (depth * tangent * aspect) <= 0.8200001);
      assert.ok(Math.abs(point.y) / (depth * tangent) <= 0.8600001);
    }
  }
  assert.equal(laptopEntryCameraOffset([{ x: 0, y: 0, z: -10 }], 1.6, 38), 0);
});
