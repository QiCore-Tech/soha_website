import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createPreviewServer } from "../../../scripts/local-preview.mjs";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const READY_TIMEOUT_MS = 30000;

async function getAvailablePort() {
  if (process.env.QICORE_E2E_PORT) {
    return Number(process.env.QICORE_E2E_PORT);
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 3100;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseURL, child) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    if (child.exitCode !== null) {
      throw new Error(`Test server exited early with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch (error) {}

    await delay(500);
  }

  throw new Error(`Timed out waiting for test server at ${baseURL}`);
}

async function findExistingServer() {
  const configuredBaseURL = process.env.QICORE_E2E_BASE_URL;
  const candidates = configuredBaseURL
    ? [configuredBaseURL]
    : process.env.CI
      ? []
      : [`http://${HOST}:3012`];

  for (const baseURL of candidates) {
    try {
      const response = await fetch(baseURL);
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("text/html")) return baseURL;
    } catch (error) {}
  }

  return null;
}

export async function startTestServer({ mode = process.env.QICORE_E2E_MODE || "dev" } = {}) {
  if (mode !== "dev" && mode !== "static") throw new Error(`Unknown E2E mode: ${mode}`);
  if (mode === "static") {
    if (process.env.QICORE_E2E_BASE_URL) {
      throw new Error("Static artifact tests cannot reuse QICORE_E2E_BASE_URL. Unset it to test out/ exclusively.");
    }
    const server = await createPreviewServer();
    const port = process.env.QICORE_E2E_PORT ? Number(process.env.QICORE_E2E_PORT) : 0;
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, HOST, resolve);
    });
    return {
      mode,
      baseURL: `http://${HOST}:${server.address().port}`,
      async stop() {
        await new Promise((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
          server.closeAllConnections();
        });
      },
    };
  }
  const existingBaseURL = await findExistingServer();
  if (existingBaseURL) {
    return {
      baseURL: existingBaseURL,
      async stop() {},
    };
  }

  const port = await getAvailablePort();
  const projectRoot = fileURLToPath(new URL("../../../../", import.meta.url));
  const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "--hostname", HOST, "--port", String(port)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: process.env.NODE_ENV || "test",
    },
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const baseURL = `http://${HOST}:${port}`;

  try {
    await waitForServer(baseURL, child);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`${error.message}\n\nstdout:\n${stdout}\n\nstderr:\n${stderr}`);
  }

  return {
    baseURL,
    async stop() {
      if (child.exitCode !== null) return;

      if (process.platform === "win32") {
        child.kill("SIGTERM");
      } else {
        process.kill(-child.pid, "SIGTERM");
      }
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        delay(5000).then(() => {
          if (child.exitCode !== null) return;
          if (process.platform === "win32") {
            child.kill("SIGKILL");
          } else {
            process.kill(-child.pid, "SIGKILL");
          }
        }),
      ]);
    },
  };
}
