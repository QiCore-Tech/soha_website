import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
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

export async function startTestServer() {
  const port = await getAvailablePort();
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "--hostname", HOST, "--port", String(port)], {
    cwd: process.cwd(),
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
