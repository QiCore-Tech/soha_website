import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

function harness({ blocked = false, saved = null } = {}) {
  const cache = new Map();
  const attributes = {};
  const events = new Map();
  const css = {};
  const root = { dataset: {}, lang: "zh-CN", style: { setProperty: (key, value) => { css[key] = value; } } };
  const document = { documentElement: root, title: "", querySelectorAll: () => [{
    getAttribute: (key) => key.endsWith("-en") ? "English" : "中文",
    setAttribute: (key, value) => { attributes[key] = value; },
  }] };
  const window = { location: { pathname: "/about" }, localStorage: {
    getItem: () => { if (blocked) throw new Error("blocked"); return saved; },
    setItem: (_key, value) => { if (blocked) throw new Error("blocked"); saved = value; },
  }, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: (name) => events.delete(name) };
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(new URL(`${name.startsWith("i18n/") ? "../../" : "../"}${name}.ts`, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, document, window,
      require: (id) => id === "./messages.json"
        ? JSON.parse(readFileSync(new URL("../../i18n/messages.json", import.meta.url), "utf8"))
        : load(id.replace(/^@\//, "")),
    });
    cache.set(name, module.exports);
    return module.exports;
  }
  const { localeInitScript } = load("i18n/init-script");
  vm.runInNewContext(localeInitScript, { root, window });
  return { store: load("stores/locale-store"), document, attributes, events, css, load };
}

test("locale defaults and pre-hydration saved English", () => {
  assert.equal(harness().store.getLocale(), "zh");
  const h = harness({ saved: "en" });
  assert.equal(h.store.getLocale(), "en");
  assert.equal(h.document.documentElement.lang, "en");
  assert.equal(h.store.getServerLocale(), "zh");
});

test("blocked storage still toggles, notifies and synchronizes cached DOM", () => {
  const h = harness({ blocked: true });
  let calls = 0;
  const unsubscribe = h.store.subscribeLocale(() => calls++);
  h.store.toggleLocale();
  assert.equal(h.store.getLocale(), "en");
  assert.equal(h.document.title, "About Us | QiCore");
  assert.equal(h.attributes.alt, "English");
  assert.equal(calls, 1);
  h.store.toggleLocale();
  assert.equal(h.document.documentElement.lang, "zh-CN");
  assert.equal(calls, 2);
  unsubscribe();
  assert.equal(h.events.size, 0);
});

test("storage events validate locale and clear resets Chinese", () => {
  const h = harness();
  const stop = h.store.subscribeLocale(() => {});
  h.events.get("storage")({ key: "qicore-locale", newValue: "en" });
  assert.equal(h.store.getLocale(), "en");
  h.events.get("storage")({ key: "unrelated", newValue: "zh" });
  assert.equal(h.store.getLocale(), "en");
  h.events.get("storage")({ key: null, newValue: null });
  assert.equal(h.store.getLocale(), "zh");
  assert.equal(h.load("i18n/config").normalizeLocale("fr"), "zh");
  stop();
});

test("message templates keep Chinese and English parameters consistent", () => {
  const { formatMessage, messages } = harness().load("i18n/messages");
  assert.equal(formatMessage(messages.runtime.roleCount, "zh", { count: 5 }), "5 个职位");
  assert.equal(formatMessage(messages.runtime.roleCount, "en", { count: 5 }), "5 roles");
  assert.equal(formatMessage(messages.runtime.roleCountOne, "en", { count: 1 }), "1 role");
  assert.equal(formatMessage(messages.runtime.reviewLabel, "en", { name: "Lin", role: "Maker" }), "Lin, Maker, view testimonial");
});

test("every catalog entry supplies both languages and matching template parameters", () => {
  const catalog = JSON.parse(readFileSync(new URL("../../i18n/messages.json", import.meta.url), "utf8"));
  let count = 0;
  function inspect(node, path = []) {
    if (typeof node?.zh === "string" || typeof node?.en === "string") {
      assert.equal(typeof node.zh, "string", `${path.join(".")}: missing zh`);
      assert.equal(typeof node.en, "string", `${path.join(".")}: missing en`);
      assert.ok(node.zh.trim() && node.en.trim(), `${path.join(".")}: empty translation`);
      const parameters = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
      assert.deepEqual(parameters(node.zh), parameters(node.en), `${path.join(".")}: parameters differ`);
      count++;
      return;
    }
    for (const [key, value] of Object.entries(node)) inspect(value, [...path, key]);
  }
  inspect(catalog);
  assert.ok(count > 300);
});

test("style lab has a localized document title", () => {
  const { pageTitles } = harness().load("i18n/messages");
  assert.equal(pageTitles["/style-lab"].en, "Style Lab | QiCore");
});

test("CSS-generated labels follow saved and switched locales", () => {
  const h = harness({ saved: "en" });
  assert.equal(h.css["--i18n-users"], '"USERS"');
  h.store.toggleLocale();
  assert.equal(h.css["--i18n-users"], '"用户"');
});
