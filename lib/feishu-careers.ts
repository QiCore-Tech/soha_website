import { request } from "node:https";
import type { CareerRole, CareerText } from "@/lib/careers-data";
import { CAREER_ROLES } from "@/lib/careers-data";

const FEISHU_API_ORIGIN = "https://open.feishu.cn";

type FeishuConfig = {
  appId: string;
  appSecret: string;
  baseToken: string;
  tableId: string;
};

type FeishuTokenResponse = {
  code?: number;
  msg?: string;
  tenant_access_token?: string;
};

type FeishuRecordPage = {
  code?: number;
  msg?: string;
  data?: {
    data?: unknown[][];
    fields?: string[];
    has_more?: boolean;
    offset?: number;
  };
};

type FeishuRecord = Record<string, unknown>;

const TAG_TRANSLATIONS: Record<string, string> = {
  "机械 / 结构": "Mechanical design",
  产品结构: "Product engineering",
  "量产 / DFM": "Manufacturing / DFM",
  智能硬件: "Smart hardware",
  硬件研发: "Hardware engineering",
  消费电子: "Consumer electronics",
  "电路 / PCB": "Circuit / PCB design",
  实习: "Internship",
  嵌入式系统: "Embedded systems",
  机器人: "Robotics",
  "MCU / C++": "MCU / C++"
};

const PLACE_TRANSLATIONS: Record<string, string> = {
  深圳: "Shenzhen"
};

const EMPLOYMENT_TRANSLATIONS: Record<string, string> = {
  全职: "Full-time",
  实习: "Internship",
  兼职: "Part-time"
};

function readConfig(): FeishuConfig | null {
  const values = {
    appId: process.env.FEISHU_APP_ID?.trim() ?? "",
    appSecret: process.env.FEISHU_APP_SECRET?.trim() ?? "",
    baseToken: process.env.FEISHU_CAREERS_BASE_TOKEN?.trim() ?? "",
    tableId: process.env.FEISHU_CAREERS_TABLE_ID?.trim() ?? ""
  };
  const configuredCount = Object.values(values).filter(Boolean).length;

  if (configuredCount === 0) return null;
  if (configuredCount !== Object.keys(values).length) {
    throw new Error(
      "Feishu Careers is partially configured. Set FEISHU_APP_ID, FEISHU_APP_SECRET, " +
      "FEISHU_CAREERS_BASE_TOKEN, and FEISHU_CAREERS_TABLE_ID together."
    );
  }

  return values;
}

function requestJson<T>(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: init.method ?? "GET", headers: init.headers }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const status = response.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          reject(new Error(`Feishu request failed with HTTP ${status}.`));
          return;
        }

        try {
          resolve(JSON.parse(body) as T);
        } catch {
          reject(new Error("Feishu returned an invalid JSON response."));
        }
      });
    });

    req.setTimeout(15_000, () => req.destroy(new Error("Feishu request timed out.")));
    req.on("error", reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

async function getTenantAccessToken(config: FeishuConfig): Promise<string> {
  const response = await requestJson<FeishuTokenResponse>(
    `${FEISHU_API_ORIGIN}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret })
    }
  );

  if (response.code !== 0 || !response.tenant_access_token) {
    throw new Error(`Unable to obtain a Feishu tenant token: ${response.msg ?? "unknown error"}.`);
  }

  return response.tenant_access_token;
}

async function getRecords(config: FeishuConfig, token: string): Promise<FeishuRecord[]> {
  const records: FeishuRecord[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(
      `/open-apis/base/v3/bases/${encodeURIComponent(config.baseToken)}/tables/${encodeURIComponent(config.tableId)}/records`,
      FEISHU_API_ORIGIN
    );
    url.searchParams.set("limit", "200");
    url.searchParams.set("offset", String(offset));

    const response = await requestJson<FeishuRecordPage>(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.code !== 0 || !response.data) {
      throw new Error(`Unable to read Feishu careers: ${response.msg ?? "unknown error"}.`);
    }

    const fields = response.data.fields ?? [];
    const rows = response.data.data ?? [];
    for (const row of rows) {
      records.push(Object.fromEntries(fields.map((field, index) => [field, row[index]])));
    }

    if (!response.data.has_more) break;
    if (!rows.length) throw new Error("Feishu returned an empty page with has_more=true.");
    offset += rows.length;
  }

  return records;
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function option(value: unknown): string {
  if (Array.isArray(value)) return text(value[0]);
  return text(value);
}

function options(value: unknown): string[] {
  if (!Array.isArray(value)) return text(value) ? [text(value)] : [];
  return value.map(text).filter(Boolean);
}

function list(value: unknown): string[] {
  return text(value)
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*(?:\d+[.)、]|[-•])\s*/, "").trim())
    .filter(Boolean);
}

function bilingualLists(zhValue: unknown, enValue: unknown, field: string, id: string): CareerText[] {
  const zh = list(zhValue);
  const en = list(enValue);

  if (zh.length !== en.length) {
    throw new Error(`Career ${id} has mismatched Chinese and English item counts in ${field}.`);
  }

  return zh.map((item, index) => ({ zh: item, en: en[index] }));
}

function required(value: unknown, field: string, id: string): string {
  const result = text(value);
  if (!result) throw new Error(`Career ${id} is missing ${field}.`);
  return result;
}

function toDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return new Date().toISOString().slice(0, 10);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid career date: ${raw}.`);
  return date.toISOString().slice(0, 10);
}

function mapRecord(record: FeishuRecord): CareerRole | null {
  if (option(record["发布状态"]) !== "招聘中") return null;

  const id = required(record["岗位 ID"], "岗位 ID", "unknown");
  const placeZh = option(record["工作地点"]) || "深圳";
  const placeEn = PLACE_TRANSLATIONS[placeZh] ?? placeZh;
  const employmentZh = option(record["工作类型"]) || "全职";
  const employmentEn = EMPLOYMENT_TRANSLATIONS[employmentZh] ?? employmentZh;
  const internshipsAvailable = record["提供实习岗位"] === true;
  const location = {
    zh: `${placeZh} · ${employmentZh}${internshipsAvailable ? " · 提供实习岗位" : ""}`,
    en: `${placeEn} · ${employmentEn}${internshipsAvailable ? " · Internships available" : ""}`
  };
  const tagValues = options(record["岗位标签"]);

  return {
    id,
    title: {
      zh: required(record["岗位名称"], "岗位名称", id),
      en: required(record["英文名称"], "英文名称", id)
    },
    team: {
      zh: required(option(record["部门"]), "部门", id),
      en: required(record["英文部门"], "英文部门", id)
    },
    location,
    type: {
      zh: text(record["薪资"]) || "薪资面议",
      en: text(record["英文薪资"]) || "Compensation discussed during the process"
    },
    summary: {
      zh: required(record["岗位简介"], "岗位简介", id),
      en: required(record["英文简介"], "英文简介", id)
    },
    responsibilities: bilingualLists(record["岗位职责"], record["英文职责"], "岗位职责", id),
    requirements: bilingualLists(record["任职要求"], record["英文要求"], "任职要求", id),
    niceToHave: bilingualLists(record["加分项"], record["英文加分项"], "加分项", id),
    benefits: bilingualLists(record["福利待遇"], record["英文福利"], "福利待遇", id),
    tags: tagValues.map((tag) => ({ zh: tag, en: TAG_TRANSLATIONS[tag] ?? tag })),
    postedAt: toDate(record["发布日期"] || record["最后更新时间"]),
    status: "open"
  };
}

function mapRecords(records: FeishuRecord[]): CareerRole[] {
  const roles = records
    .map(mapRecord)
    .filter((role): role is CareerRole => role !== null)
    .sort((a, b) => {
      const recordA = records.find((record) => text(record["岗位 ID"]) === a.id);
      const recordB = records.find((record) => text(record["岗位 ID"]) === b.id);
      return Number(recordA?.["排序"] ?? Number.MAX_SAFE_INTEGER) - Number(recordB?.["排序"] ?? Number.MAX_SAFE_INTEGER);
    });

  const uniqueIds = new Set(roles.map((role) => role.id));
  if (uniqueIds.size !== roles.length) throw new Error("Feishu careers contain duplicate 岗位 ID values.");
  return roles;
}

export async function getCareerRoles(): Promise<CareerRole[]> {
  const config = readConfig();
  if (!config) return CAREER_ROLES;

  const token = await getTenantAccessToken(config);
  const records = await getRecords(config, token);
  return mapRecords(records);
}
