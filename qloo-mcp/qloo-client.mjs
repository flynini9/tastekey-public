// ─────────────────────────────────────────────────────────────
// TasteKey · Qloo REST client（零依赖，MCP 与 agent-server 共用）
//
// 凭证读取顺序（永远不写入日志 / 响应 / 仓库）：
//   1. 显式传入的 keyFile
//   2. 环境变量 QLOO_API_KEY
//   3. 环境变量 QLOO_KEY_FILE 指向的文件
//   4. tastekey/.qloo-key
//   5. ~/.config/qloo/{key,credentials.json,config.json}
//   6. ~/.qloo/{credentials.json,config.json}
//
// Base URL 默认赛事环境：https://hackathon.api.qloo.com
// 可用 QLOO_BASE 覆盖（生产 key 才用 https://api.qloo.com）。
//
// QLOO_MOCK=1 时不发网络请求，返回 fixtures.mjs 的仿真响应，
// 用于没有 key 的机器上跑通 MCP → agent → 前端全链路。
// ─────────────────────────────────────────────────────────────

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mockSearch, mockInsights, mockTags } from "./fixtures.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TASTEKEY_DIR = path.dirname(HERE);

export const DEFAULT_BASE = process.env.QLOO_BASE || "https://hackathon.api.qloo.com";
export const DEFAULT_KEY_FILES = [
  process.env.QLOO_KEY_FILE,
  path.join(TASTEKEY_DIR, ".qloo-key"),
  path.join(os.homedir(), ".config", "qloo", "key"),
  path.join(os.homedir(), ".config", "qloo", "credentials.json"),
  path.join(os.homedir(), ".config", "qloo", "config.json"),
  path.join(os.homedir(), ".qloo", "credentials.json"),
  path.join(os.homedir(), ".qloo", "config.json"),
  path.join(os.homedir(), ".qloo", "key"),
].filter(Boolean);

export class QlooError extends Error {
  constructor(message, status = 0, body = "") {
    super(message);
    this.name = "QlooError";
    this.status = status;
    this.body = body;
  }
}

function deepFindKey(value, depth = 0) {
  if (depth > 6 || value == null) return "";
  if (typeof value === "string") return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = deepFindKey(item, depth + 1);
      if (found) return found;
    }
    return "";
  }
  if (typeof value !== "object") return "";
  for (const [k, v] of Object.entries(value)) {
    if (/^(api[_-]?key|apikey|token|credential|secret)$/i.test(k) && typeof v === "string" && v.trim().length >= 8) {
      return v.trim();
    }
  }
  for (const v of Object.values(value)) {
    const found = deepFindKey(v, depth + 1);
    if (found) return found;
  }
  return "";
}

function readKeyFromFile(file) {
  if (!file) return "";
  try {
    if (!fs.existsSync(file)) return "";
    const raw = fs.readFileSync(file, "utf8").trim();
    if (!raw) return "";
    if (raw.startsWith("{")) {
      try {
        return deepFindKey(JSON.parse(raw));
      } catch {
        return "";
      }
    }
    // 纯文本：取第一行，去掉可能存在的 KEY= 前缀与引号
    const line = raw.split(/\r?\n/).find((l) => l.trim()) || "";
    return line.replace(/^\s*[A-Z0-9_]+\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();
  } catch {
    return "";
  }
}

export function resolveApiKey({ keyFile } = {}) {
  if (process.env.QLOO_MOCK === "1") return "mock-key";
  if (keyFile) {
    const key = readKeyFromFile(keyFile);
    if (key) return key;
  }
  if (process.env.QLOO_API_KEY && process.env.QLOO_API_KEY.trim()) return process.env.QLOO_API_KEY.trim();
  for (const file of DEFAULT_KEY_FILES) {
    const key = readKeyFromFile(file);
    if (key) return key;
  }
  return "";
}

export function keySource() {
  if (process.env.QLOO_MOCK === "1") return "mock";
  if (process.env.QLOO_API_KEY && process.env.QLOO_API_KEY.trim()) return "env:QLOO_API_KEY";
  for (const file of DEFAULT_KEY_FILES) {
    if (readKeyFromFile(file)) return file;
  }
  return "";
}

function buildUrl(base, pathname, params) {
  const url = new URL(pathname.replace(/^\//, ""), base.endsWith("/") ? base : base + "/");
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null || v === "") continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      // Qloo 的 array 参数是 form/explode=false，即逗号分隔
      url.searchParams.set(k, v.join(","));
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  return url;
}

function pickProperties(properties) {
  if (!properties || typeof properties !== "object") return {};
  const keys = [
    "description",
    "image",
    "address",
    "geocode",
    "rating",
    "price_level",
    "business_rating",
    "release_year",
    "artist",
    "album",
    "duration",
    "cuisine",
    "phone",
    "website",
  ];
  const out = {};
  for (const k of keys) {
    if (properties[k] !== undefined) out[k] = properties[k];
  }
  return out;
}

// 实体外壳两种形态：旧版 type+subtype；现行 search 返回复数 types 数组（如
// ["urn:entity","urn:entity:locality"]）——统一取具体的那个 urn:entity:*
function subtypeOf(entity) {
  if (entity.subtype) return entity.subtype;
  if (Array.isArray(entity.types)) {
    const specific = entity.types.find((t) => t && t.startsWith("urn:entity:") && t !== "urn:entity");
    if (specific) return specific;
  }
  return "";
}

export function trimEntity(entity, full = false) {
  if (!entity || typeof entity !== "object") return entity;
  if (full) return entity;
  return {
    entity_id: entity.entity_id || entity.id || "",
    name: entity.name || entity.title || "",
    subtype: subtypeOf(entity),
    popularity: entity.popularity,
    tags: Array.isArray(entity.tags)
      ? entity.tags.slice(0, 16).map((t) => ({ id: t.id, name: t.name, type: t.type }))
      : undefined,
    properties: pickProperties(entity.properties),
  };
}

export function normalizeSearch(json) {
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.entities)) return json.entities;
  if (Array.isArray(json?.results?.entities)) return json.results.entities;
  return [];
}

export function normalizeInsights(json) {
  if (Array.isArray(json?.results?.entities)) return json.results.entities;
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.entities)) return json.entities;
  return [];
}

// /v2/tags 响应外壳：{results:{tags:[…]}}；兼容 {results:[…]} / {tags:[…]}
export function normalizeTags(json) {
  if (Array.isArray(json?.results?.tags)) return json.results.tags;
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.tags)) return json.tags;
  return [];
}

async function request(pathname, params, { full = false, timeoutMs = 30000, retries = 2 } = {}) {
  if (process.env.QLOO_MOCK === "1") {
    if (pathname.includes("/search")) return mockSearch(params);
    if (pathname.includes("/tags")) return mockTags(params);
    return mockInsights(params);
  }

  const key = resolveApiKey();
  if (!key) {
    throw new QlooError(
      "Qloo key 未配置。请设置环境变量 QLOO_API_KEY 后重试。",
      401,
    );
  }

  const url = buildUrl(DEFAULT_BASE, pathname, params);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "X-Api-Key": key,
          Accept: "application/json",
          "User-Agent": "TasteKey/1.0 (+Qloo hackathon)",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (res.ok) return json;

      // 429 / 5xx 做有界重试；401/403/404 不重试
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }

      const reason = json?.message || json?.reason || text.slice(0, 300);
      throw new QlooError(`Qloo ${res.status} ${res.statusText}: ${reason}`, res.status, text.slice(0, 1000));
    } catch (err) {
      lastError = err;
      if (err instanceof QlooError) throw err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
    }
  }

  throw new QlooError(`Qloo 请求失败: ${lastError?.message || lastError}`, 0);
}

export async function search({ query, types, take = 10, location, full = false } = {}) {
  if (!query) throw new QlooError("search 需要 query", 400);
  const json = await request("/search", {
    query,
    types,
    take,
    "filter.location": location,
  });
  return { raw: json, results: normalizeSearch(json).slice(0, take).map((e) => trimEntity(e, full)) };
}

export async function insights({
  filterType,
  take = 10,
  entityId,
  locationQuery,
  location,
  tags,
  signalEntities,
  minPopularity,
  full = false,
  extra = {},
} = {}) {
  if (!filterType) throw new QlooError("insights 需要 filterType（如 urn:entity:place）", 400);
  const params = {
    "filter.type": filterType,
    take,
    "signal.interests.entities": signalEntities || entityId,
    "signal.location.query": locationQuery,
    "signal.location": location,
    "filter.tags": tags,
    "filter.popularity.min": minPopularity,
    ...extra,
  };
  const json = await request("/v2/insights", params);
  return { raw: json, results: normalizeInsights(json).slice(0, take).map((e) => trimEntity(e, full)) };
}

export async function tags({ query, type, take = 20, full = false } = {}) {
  if (!query) throw new QlooError("tags 需要 query", 400);
  // 端点参数是 filter.query（2026-10 实测：裸 query 报 400 列出合法参数集）
  const json = await request("/v2/tags", { "filter.query": query, "filter.tag.types": type, take });
  const results = normalizeTags(json).slice(0, take).map((e) => trimEntity(e, full));
  return { raw: json, results };
}

export async function health() {
  if (process.env.QLOO_MOCK === "1") {
    return { ok: true, mode: "mock", base: DEFAULT_BASE, keySource: "mock" };
  }
  const key = resolveApiKey();
  if (!key) return { ok: false, mode: "live", base: DEFAULT_BASE, keySource: "", error: "缺少 QLOO_API_KEY" };
  try {
    const res = await search({ query: "Austin, TX", types: "urn:entity:locality", take: 1 });
    return { ok: true, mode: "live", base: DEFAULT_BASE, keySource: keySource(), sample: res.results[0]?.name || null };
  } catch (err) {
    return { ok: false, mode: "live", base: DEFAULT_BASE, keySource: keySource(), error: err.message, status: err.status };
  }
}

export { TASTEKEY_DIR, HERE };
