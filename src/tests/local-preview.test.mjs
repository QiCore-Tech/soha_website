import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createPreviewServer } from "../scripts/local-preview.mjs";
import { startTestServer } from "./e2e/helpers/test-server.mjs";

test("static preview serves exports, deep links and real 404s without writes", async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "qicore-preview-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const directory = path.join(temporary, "export");
  await mkdir(path.join(directory, "nested"), { recursive: true });
  await writeFile(path.join(directory, "index.html"), "<h1>Home</h1>");
  await writeFile(path.join(directory, "about.html"), "<h1>About</h1>");
  await writeFile(path.join(directory, "nested/index.html"), "<h1>Nested</h1>");
  await writeFile(path.join(directory, "404.html"), "<h1>Not found</h1>");
  await writeFile(path.join(directory, "app.js"), "window.ready = true;");
  await writeFile(path.join(temporary, "secret.txt"), "do not expose");
  await symlink(path.join(temporary, "secret.txt"), path.join(directory, "escape.txt"));
  const server = await createPreviewServer({ directory });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  for (const route of ["/", "/about", "/about/", "/about.html", "/nested", "/nested/", "/about?lang=en"]) {
    const response = await fetch(`${baseURL}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("x-qicore-preview"), "static-readonly");
  }
  const head = await fetch(`${baseURL}/about`, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.ok(Number(head.headers.get("content-length")) > 0);
  assert.match((await fetch(`${baseURL}/app.js`)).headers.get("content-type"), /javascript/);
  for (const route of ["/missing/deep/link", "/api/beta", "/escape.txt"]) {
    const response = await fetch(`${baseURL}${route}`);
    assert.equal(response.status, 404, route);
    assert.match(await response.text(), /Not found/);
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await fetch(`${baseURL}/api/beta`, { method });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
  }
  // Raw request paths avoid fetch's automatic dot-segment normalization.
  for (const route of ["/%", "/%2e%2e/secret.txt", "/%2F..%2Fsecret.txt", "/.env", "/%00", "/a%5Cb"]) {
    const status = await new Promise((resolve, reject) => {
      http.get({ hostname: "127.0.0.1", port: server.address().port, path: route }, (response) => { response.resume(); resolve(response.statusCode); }).on("error", reject);
    });
    assert.equal(status, 400, route);
  }
});

test("missing static export fails with build guidance", async () => {
  await assert.rejects(createPreviewServer({ directory: path.join(os.tmpdir(), `missing-export-${process.pid}`) }), /npm run build/);
});

test("static E2E mode rejects external or development server reuse", async (t) => {
  const original = process.env.QICORE_E2E_BASE_URL;
  process.env.QICORE_E2E_BASE_URL = "http://127.0.0.1:3012";
  t.after(() => {
    if (original === undefined) delete process.env.QICORE_E2E_BASE_URL;
    else process.env.QICORE_E2E_BASE_URL = original;
  });
  await assert.rejects(startTestServer({ mode: "static" }), /cannot reuse/);
  await assert.rejects(startTestServer({ mode: "invalid" }), /Unknown E2E mode/);
});
