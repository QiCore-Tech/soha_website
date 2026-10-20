import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const module = { exports: {} };
const source = readFileSync(new URL("../features/home/lib/home-motion-policy.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module, exports: module.exports });
const { getHomeMotionMode, canAutoplayHomeVideo } = module.exports;
const desktop = { width: 1440, height: 900, finePointer: true, hover: true, tier: "medium", reducedMotion: false };

test("medium and high desktops get full motion only with sufficient viewport and input", () => {
  assert.equal(getHomeMotionMode(desktop), "full");
  assert.equal(getHomeMotionMode({ ...desktop, tier: "high" }), "full");
  for (const change of [{ width: 1199 }, { height: 759 }, { finePointer: false }, { hover: false }]) {
    assert.equal(getHomeMotionMode({ ...desktop, ...change }), "light");
  }
});

test("phone landscape, tablets and small windows never pin", () => {
  for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768], [1440, 600]]) {
    assert.equal(getHomeMotionMode({ ...desktop, width, height }), "light");
  }
});

test("reduced motion and low performance always render static", () => {
  assert.equal(getHomeMotionMode({ ...desktop, reducedMotion: true }), "static");
  assert.equal(getHomeMotionMode({ ...desktop, tier: "low" }), "static");
});

test("video autoplay requires all permission, performance and loading conditions", () => {
  const allowed = { tier: "medium", reducedMotion: false, saveData: false, motionAvailable: true };
  assert.equal(canAutoplayHomeVideo(allowed), true);
  for (const change of [{ tier: "low" }, { reducedMotion: true }, { saveData: true }, { motionAvailable: false }]) {
    assert.equal(canAutoplayHomeVideo({ ...allowed, ...change }), false);
  }
});
