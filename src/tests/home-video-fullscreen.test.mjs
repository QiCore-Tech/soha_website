import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../features/home/lib/home-video-fullscreen.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load(document) {
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, ...(document ? { document } : {}) });
  return module.exports;
}

test("fullscreen targets the stable workspace instead of the pinned video host", () => {
  const workspace = {};
  const host = { closest: selector => selector === "[data-home-chapter=\"workspace\"]" ? workspace : null };
  assert.equal(load().getWorkspaceFullscreenTarget(host), workspace);
  const standalone = { closest: () => null };
  assert.equal(load().getWorkspaceFullscreenTarget(standalone), standalone);
});

test("fullscreen detection covers standard, WebKit and native-video flags", () => {
  const element = { contains: () => false, closest: () => null };
  const workspace = { matches: selector => selector === "[data-home-chapter=\"workspace\"]", contains: () => true };
  const document = { fullscreenElement: workspace };
  const { isHomeVideoFullscreen } = load(document);
  assert.equal(isHomeVideoFullscreen(element), true);
  document.fullscreenElement = null;
  assert.equal(isHomeVideoFullscreen(element), false);
  document.webkitFullscreenElement = workspace;
  assert.equal(isHomeVideoFullscreen(element), true);
  delete document.webkitFullscreenElement;
  element.closest = () => workspace;
  assert.equal(isHomeVideoFullscreen(element), true);
  assert.equal(load().isHomeVideoFullscreen(element), false, "SSR has no document dependency");
});
