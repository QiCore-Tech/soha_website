import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../features/home/lib/home-carousel-motion.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module, exports: module.exports });
const { CAROUSEL_IMAGE_MOTION_DURATION, getCarouselImageMotion } = module.exports;

test("each random half selects a different image zoom direction", () => {
  for (const value of [0, 0.1, 0.499999]) {
    const motion = getCarouselImageMotion(value);
    assert.equal(motion.direction, "in");
    assert.equal(motion.from, 1);
    assert.equal(motion.to, 1.12);
  }
  for (const value of [0.5, 0.8, 0.999999]) {
    const motion = getCarouselImageMotion(value);
    assert.equal(motion.direction, "out");
    assert.equal(motion.from, 1.12);
    assert.equal(motion.to, 1);
  }
});

test("zoom stays covered and finishes faster than the old 7.5-second motion", () => {
  assert.equal(CAROUSEL_IMAGE_MOTION_DURATION, 3800);
  assert.ok(CAROUSEL_IMAGE_MOTION_DURATION < 7500 / 1.5);
  for (let value = 0; value < 1; value += 0.05) {
    const { from, to } = getCarouselImageMotion(value);
    assert.ok(from >= 1 && to >= 1);
    assert.ok(from <= 1.12 && to <= 1.12);
  }
});

test("random selection never gets stuck in three consecutive identical zooms", () => {
  assert.equal(getCarouselImageMotion(0.1, ["in", "in"]).direction, "out");
  assert.equal(getCarouselImageMotion(0.9, ["out", "out"]).direction, "in");
  assert.equal(getCarouselImageMotion(0.1, ["in", "out"]).direction, "in");
  assert.equal(getCarouselImageMotion(0.9, ["out", "in"]).direction, "out");
});
