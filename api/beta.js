
async function saveToFeishu(fields) {
  const appId = process.env.FEISHU_BETA_APP_ID;
  const appSecret = process.env.FEISHU_BETA_APP_SECRET;
  if (!appId || !appSecret || appSecret === "[SENSITIVE]" || !process.env.FEISHU_BETA_BASE_TOKEN || !process.env.FEISHU_BETA_TABLE_ID) throw new Error("NOT_CONFIGURED");
  const signal = AbortSignal.timeout(8000);
  async function request(path, body, token) {
    const response = await fetch(`https://open.feishu.cn${path}`, {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok || data.code !== 0) throw new Error("FEISHU_WRITE_FAILED");
    return data;
  }
  const auth = await request("/open-apis/auth/v3/tenant_access_token/internal", { app_id: appId, app_secret: appSecret });
  if (!auth.tenant_access_token) throw new Error("FEISHU_AUTH_FAILED");
  const base = process.env.FEISHU_BETA_BASE_TOKEN;
  const table = process.env.FEISHU_BETA_TABLE_ID;
  const result = await request(`/open-apis/base/v3/bases/${encodeURIComponent(base)}/tables/${encodeURIComponent(table)}/records/batch_create`, { create_records: [fields] }, auth.tenant_access_token);
  if (!result.data?.record_id_list?.length) throw new Error("FEISHU_WRITE_UNCONFIRMED");
}

function createBetaHandler(save = saveToFeishu) {
  return async function beta(req, res) {
    const send = (status, data) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(data)); };
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(405, { ok: false }); }
    if (req.headers.origin) {
      try {
        const origin = new URL(req.headers.origin);
        if (origin.host !== req.headers.host) return send(403, { ok: false });
      } catch { return send(403, { ok: false }); }
    }
    let data;
    try {
      const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
      if (Buffer.byteLength(raw) > 4096) return send(413, { ok: false });
      data = JSON.parse(raw);
    } catch { return send(400, { ok: false }); }
    const email = typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email)) return send(400, { ok: false });
    const fields = {
      "邮箱": email, "申请时间": new Date().toISOString(),
      "语言": data.locale === "en" ? "English" : "中文",
      "来源": data.source === "hero" ? "官网 Oyscat 首屏" : "官网 Oyscat 页尾",
      "申请状态": ["待筛选"], "回信状态": ["待联系"]
    };
    try { await save(fields); return send(200, { ok: true }); }
    catch (error) { return send(error.message === "NOT_CONFIGURED" ? 503 : 502, { ok: false, error: "Unable to save application. Please try again later." }); }
  };
}
module.exports = createBetaHandler();
module.exports.createBetaHandler = createBetaHandler;
