import http from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".mp4": "video/mp4",
};

// Only read the export: never import API handlers, initialize Next, or submit forms.
export async function createPreviewServer({ directory = path.join(PROJECT_ROOT, "out") } = {}) {
  let root;
  try {
    root = await realpath(directory);
    if (!(await stat(path.join(root, "index.html"))).isFile()) throw new Error("Missing index.html");
  } catch {
    throw new Error(`Static export missing at ${directory}. Run npm run build first.`);
  }

  async function findFile(relative) {
    try {
      const filename = await realpath(path.join(root, relative));
      if (!filename.startsWith(`${root}${path.sep}`)) return null;
      const info = await stat(filename);
      return info.isFile() ? { filename, size: info.size } : null;
    } catch {
      return null;
    }
  }

  return http.createServer(async (req, res) => {
    res.setHeader("X-QiCore-Preview", "static-readonly");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    const end = (status, message) => {
      res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : message);
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      return end(405, "Read-only static preview: form submissions and API writes are disabled.");
    }

    let pathname;
    try {
      pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch {
      return end(400, "Invalid URL encoding");
    }
    if (!pathname.startsWith("/") || pathname.includes("\\") || pathname.includes("\0") ||
        pathname.split("/").some((part) => part.startsWith("."))) {
      return end(400, "Invalid path");
    }
    // No SPA fallback: missing deep links must retain a real HTTP 404.
    const relative = pathname.replace(/^\/+|\/+$/g, "");
    const candidates = !relative ? ["index.html"] : pathname.endsWith("/")
      ? [`${relative}/index.html`, `${relative}.html`]
      : [relative, `${relative}.html`, `${relative}/index.html`];
    let file;
    for (const candidate of candidates) {
      file = await findFile(candidate);
      if (file) break;
    }
    const status = file ? 200 : 404;
    if (!file) file = await findFile("404.html");
    if (!file) return end(404, "Not found");
    res.writeHead(status, {
      "Content-Type": MIME_TYPES[path.extname(file.filename)] || "application/octet-stream",
      "Content-Length": file.size,
    });
    if (req.method === "HEAD") return res.end();
    const stream = createReadStream(file.filename);
    stream.on("error", () => res.destroy());
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid PORT");
  const server = await createPreviewServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`STATIC READ-ONLY http://127.0.0.1:${server.address().port} — serving out/; all writes disabled`);
  });
}
