const { timingSafeEqual } = require("node:crypto");

const FEISHU_API_ORIGIN = "https://open.feishu.cn";

function json(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.send(JSON.stringify(body));
}

function safeEqual(left, right) {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function clean(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function dueInTwoDays() {
  const due = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  due.setUTCHours(15, 59, 0, 0);
  return due.getTime().toString();
}

async function feishuRequest(path, token, init = {}) {
  const response = await fetch(`${FEISHU_API_ORIGIN}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.code !== 0) {
    const message = clean(payload.msg, `HTTP ${response.status}`);
    throw new Error(`Feishu request failed: ${message}`);
  }

  return payload;
}

async function getTenantAccessToken(appId, appSecret) {
  const payload = await feishuRequest("/open-apis/auth/v3/tenant_access_token/internal", "", {
    method: "POST",
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });
  if (!payload.tenant_access_token) throw new Error("Feishu did not return a tenant access token.");
  return payload.tenant_access_token;
}

module.exports = async function recruitmentIntake(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { success: false, message: "Method not allowed." });
  }

  const appId = clean(process.env.FEISHU_APP_ID);
  const appSecret = clean(process.env.FEISHU_APP_SECRET);
  const webhookSecret = clean(process.env.FEISHU_RECRUITMENT_WEBHOOK_SECRET);
  const assigneeOpenId = clean(process.env.FEISHU_RECRUITMENT_ASSIGNEE_OPEN_ID);
  const suppliedSecret = clean(request.headers["x-qicore-webhook-secret"]);

  if (!appId || !appSecret || !webhookSecret || !assigneeOpenId) {
    return json(response, 503, { success: false, message: "Recruitment automation is not configured." });
  }
  if (!safeEqual(suppliedSecret, webhookSecret)) {
    return json(response, 401, { success: false, message: "Unauthorized." });
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
  } catch {
    return json(response, 400, { success: false, message: "Invalid JSON body." });
  }
  const applicationId = clean(body.application_id);
  const applicationUrl = clean(body.application_url);
  const candidateName = clean(body.candidate_name, "未填写姓名");
  const roleName = clean(body.role_name, "未指定岗位");
  const phone = clean(body.phone, "未填写");
  const email = clean(body.email, "未填写");
  const experience = clean(body.experience, "未填写");
  const city = clean(body.city, "未填写");

  if (!applicationId || !applicationUrl) {
    return json(response, 400, { success: false, message: "Missing application reference." });
  }

  try {
    const token = await getTenantAccessToken(appId, appSecret);
    const dueAt = dueInTwoDays();
    const taskPayload = await feishuRequest("/open-apis/task/v2/tasks?user_id_type=open_id", token, {
      method: "POST",
      body: JSON.stringify({
        summary: `[招聘初筛] ${candidateName} · ${roleName}`,
        description: [
          `应聘岗位：${roleName}`,
          `联系电话：${phone}`,
          `联系邮箱：${email}`,
          `工作经验：${experience}`,
          `所在城市：${city}`,
          "",
          `投递详情：${applicationUrl}`
        ].join("\n"),
        client_token: `qicore-careers-${applicationId}`,
        members: [{ id: assigneeOpenId, role: "assignee", type: "user" }],
        due: { timestamp: dueAt, is_all_day: false },
        reminders: [{ relative_fire_minute: 24 * 60 }],
        origin: {
          href: { title: "查看候选人投递", url: applicationUrl },
          platform_i18n_name: { zh_cn: "QiCore 招聘", en_us: "QiCore Careers" }
        },
        extra: Buffer.from(JSON.stringify({ application_id: applicationId })).toString("base64")
      })
    });
    const task = taskPayload.data?.task;
    if (!task?.guid || !task?.url) throw new Error("Feishu did not return the created task.");

    return json(response, 200, {
      success: true,
      message: "Initial screening task created.",
      task_guid: task.guid,
      task_url: task.url,
      due_at: Number(dueAt)
    });
  } catch (error) {
    console.error("Recruitment intake automation failed:", error instanceof Error ? error.message : error);
    return json(response, 502, { success: false, message: "Unable to create the screening task." });
  }
};
