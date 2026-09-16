import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadCareers(env) {
  const fixtureImports = [];
  function load(file) {
    const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
    vm.runInNewContext(code, {
      module, exports: module.exports, process: { env }, Buffer, URL,
      require(id) {
        if (id === "./careers-local-sample") {
          fixtureImports.push(id);
          return load("../lib/careers-local-sample.ts");
        }
        if (id === "node:https") return { request() { throw new Error("REAL_FEISHU_PATH"); } };
        return require(id);
      }
    });
    return module.exports;
  }
  return { api: load("../lib/feishu-careers.ts"), fixtureImports };
}

test("unconfigured local dev shows one explicitly labeled bilingual sample", async () => {
  const { api, fixtureImports } = loadCareers({ NODE_ENV: "development" });
  const roles = await api.getCareerRoles();
  assert.equal(roles.length, 1);
  assert.match(roles[0].title.zh, /本地示例/);
  assert.match(roles[0].title.en, /local sample/);
  assert.equal(fixtureImports.length, 1);
});

for (const env of [
  { NODE_ENV: "production" },
  { NODE_ENV: "test" },
  { NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "preview" },
  { NODE_ENV: "development", VERCEL: "1" },
  { NODE_ENV: "development", VERCEL_ENV: "preview" }
]) {
  test(`sample is never imported outside local dev: ${JSON.stringify(env)}`, async () => {
    const { api, fixtureImports } = loadCareers(env);
    assert.equal((await api.getCareerRoles()).length, 0);
    assert.equal(fixtureImports.length, 0);
  });
}

test("Vercel production still rejects missing real data", async () => {
  const { api, fixtureImports } = loadCareers({ NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "production" });
  await assert.rejects(api.getCareerRoles(), /Refusing to publish/);
  assert.equal(fixtureImports.length, 0);
});

test("configured local development uses real data, never the sample", async () => {
  const { api, fixtureImports } = loadCareers({ NODE_ENV: "development", FEISHU_APP_ID: "test", FEISHU_APP_SECRET: "test", FEISHU_CAREERS_BASE_TOKEN: "test", FEISHU_CAREERS_TABLE_ID: "test" });
  await assert.rejects(api.getCareerRoles(), /REAL_FEISHU_PATH/);
  assert.equal(fixtureImports.length, 0);
});
