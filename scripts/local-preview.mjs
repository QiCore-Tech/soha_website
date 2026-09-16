import http from "node:http";
import beta from "../api/beta.js";

if (process.env.VERCEL || process.env.NODE_ENV === "production") throw new Error("Local preview only");
process.env.QICORE_PREVIEW = "1";
const { default: next } = await import("next");
const port = Number(process.env.PORT || 3016);
const app = next({ dev: true, hostname: "127.0.0.1", port });
await app.prepare();
const nextHandler = app.getRequestHandler();
const handler = beta;
let queue = Promise.resolve();
http.createServer(async (req, res) => {
  if (req.url?.split("?")[0] !== "/api/beta") return nextHandler(req, res);
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 4096) { res.writeHead(413); res.end(); return; }
  }
  req.body = raw;
  queue = queue.then(() => handler(req, res)).catch(() => { if (!res.writableEnded) { res.writeHead(500); res.end(); } });
}).listen(port, "127.0.0.1", () => console.log(`LOCAL http://127.0.0.1:${port} — Beta submissions use the production handler and Feishu application identity; no email sent`));
