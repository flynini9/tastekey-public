#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// TasteKey · 运行时后端（零依赖 Node http）
//
// 双职责：
//   1. 静态服务 tastekey/（index.html / js / raw/ 快照）
//   2. GET /api/plan?q=<地址|城市|店名>&brand=<气质自然语言>
//      任意地址 → Qloo locality 解析 → 气质词典 → 标签过滤的三域推荐
//      → 画像共现统计 → 气质×街区匹配度，单包 JSON 返回
//
// 凭证：走 qloo-client 读链（~/.qloo/key / 环境变量），绝不回传前端。
// 单次请求 4-8 个 Qloo 调用（含空结果回退），响应缓存 10 分钟。
// 启动：node server-http.mjs   （默认 http://127.0.0.1:8765）
// ─────────────────────────────────────────────────────────────

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { search, insights, tags, resolveApiKey, DEFAULT_BASE } from "./qloo-mcp/qloo-client.mjs";
import { parseBrandText, parseBrandOpen, tagUrnsForDomain, paletteFor, PALETTES } from "./qloo-mcp/brand-dict.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8765);
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".md": "text/markdown; charset=utf-8",
};

const PLAN_CACHE = new Map(); // "q|brand" → {json, at}
const CACHE_TTL = 10 * 60 * 1000;

/* ── 静态服务 ── */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT) || /(\.qloo-key|\.env|node_modules|\.git|\.mimosa)/.test(file)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end("Not Found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}

/* ── 中文地名 Gazetteer：Qloo 对中文查询解析不稳定（同词时对时错，
   实测"洛杉矶"一次解析 LA、一次解析到孟买 Ward），进 Qloo 前先归一成英文 ── */
const ZH_PLACE = {
  洛杉矶: "Los Angeles", 纽约: "New York", 旧金山: "San Francisco", 西雅图: "Seattle",
  奥斯汀: "Austin", 迈阿密: "Miami", 芝加哥: "Chicago", 波士顿: "Boston", 拉斯维加斯: "Las Vegas",
  圣地亚哥: "San Diego", 丹佛: "Denver", 波特兰: "Portland", 新奥尔良: "New Orleans",
  华盛顿: "Washington, DC", 费城: "Philadelphia", 凤凰城: "Phoenix", 纳什维尔: "Nashville",
  亚特兰大: "Atlanta", 休斯顿: "Houston", 达拉斯: "Dallas", 明尼阿波利斯: "Minneapolis",
  底特律: "Detroit", 圣路易斯: "St. Louis", 坦帕: "Tampa", 奥兰多: "Orlando", 檀香山: "Honolulu",
  多伦多: "Toronto", 温哥华: "Vancouver", 蒙特利尔: "Montreal", 墨西哥城: "Mexico City",
  伦敦: "London", 巴黎: "Paris", 柏林: "Berlin", 马德里: "Madrid", 巴塞罗那: "Barcelona",
  罗马: "Rome", 米兰: "Milan", 阿姆斯特丹: "Amsterdam", 维也纳: "Vienna", 苏黎世: "Zurich",
  斯德哥尔摩: "Stockholm", 哥本哈根: "Copenhagen", 都柏林: "Dublin", 爱丁堡: "Edinburgh",
  曼彻斯特: "Manchester", 东京: "Tokyo", 大阪: "Osaka", 京都: "Kyoto", 首尔: "Seoul",
  曼谷: "Bangkok", 新加坡: "Singapore", 香港: "Hong Kong", 台北: "Taipei", 上海: "Shanghai",
  北京: "Beijing", 广州: "Guangzhou", 深圳: "Shenzhen", 杭州: "Hangzhou", 成都: "Chengdu",
  西安: "Xi'an", 重庆: "Chongqing", 悉尼: "Sydney", 墨尔本: "Melbourne", 布里斯班: "Brisbane",
  奥克兰: "Auckland", 迪拜: "Dubai", 多哈: "Doha", 伊斯坦布尔: "Istanbul", 里约热内卢: "Rio de Janeiro",
  圣保罗: "São Paulo", 布宜诺斯艾利斯: "Buenos Aires", 开普敦: "Cape Town", 开罗: "Cairo", 莫斯科: "Moscow",
};
const ZH_DISTRICT = { 市中心: "Downtown", 市区: "Downtown", 中心: "Downtown", 唐人街: "Chinatown", 机场: "Airport", 大学城: "University District", 海滩: "Beach", 港区: "Harbor" };

function normQuery(q) {
  let out = q;
  for (const k of Object.keys(ZH_PLACE).sort((a, b) => b.length - a.length)) {
    if (out.includes(k)) out = out.split(k).join(" " + ZH_PLACE[k] + " ");
  }
  for (const k of Object.keys(ZH_DISTRICT).sort((a, b) => b.length - a.length)) {
    if (out.includes(k)) out = out.split(k).join(" " + ZH_DISTRICT[k] + " ");
  }
  // 剩余零散中文（助词等）对 Qloo 无意义，剥掉
  return out.replace(/[\u4e00-\u9fff]+/g, " ").replace(/\s+/g, " ").trim();
}

/* ── 地址解析：locality 优先 → 自由类型兜底（POI/街道名也能落到实体） ── */
async function resolveAnywhere(q) {
  try {
    const s = await search({ query: q, types: "urn:entity:locality", take: 3, full: true });
    const first = s.results?.[0];
    if (first?.entity_id) return { id: first.entity_id, name: first.name, disambiguation: first.disambiguation || "", kind: "locality" };
  } catch { /* 落到自由搜索 */ }
  const free = await search({ query: q, take: 5 });
  // 兜底实体防漂移：只收 locality，或名称/消歧串与查询共享 ≥4 字母词元
  // （否则"洛杉矶"会落到 R/C Ward Mumbai 这类完全无关的全球实体）
  const qTokens = q.toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 4);
  const hit = free.results.find((e) => {
    if (!e.entity_id) return false;
    if ((e.subtype || "") === "locality") return true;
    if (!qTokens.length) return false;
    const hay = ((e.name || "") + " " + (e.disambiguation || "")).toLowerCase();
    return qTokens.some((t) => hay.includes(t));
  }) || null;
  if (!hit) {
    const sugg = free.results.map((e) => e.name).slice(0, 3);
    const err = new Error(sugg.length ? "unresolved:sugg" : "unresolved");
    err.suggestions = sugg;
    throw err;
  }
  return { id: hit.entity_id, name: hit.name, disambiguation: hit.disambiguation || "", kind: hit.subtype || "entity" };
}

/* ── 画像共现统计（与快照层同口径） ── */
const PROFILE_TAG_TYPES = {
  age: "urn:tag:age_range:qloo",
  custom: "urn:tag:customer_identity:qloo",
  intent: "urn:tag:visit_intent:qloo",
  tod: "urn:tag:time_of_day_fit:qloo",
};
const DOMAIN_BARS = [
  { k: { zh: "音乐", en: "Music" }, kws: ["music", "jazz", "vinyl", "record", "concert", "venue"] },
  { k: { zh: "餐饮", en: "Dining" }, kws: ["barbecue", "taco", "food", "restaurant", "breakfast", "brunch", "market", "kitchen"] },
  { k: { zh: "饮品", en: "Drinks" }, kws: ["beer", "cocktail", "wine", "coffee", "cafe", "brewery", "espresso"] },
  { k: { zh: "自然户外", en: "Outdoors" }, kws: ["park", "trail", "beach", "lake", "garden", "nature", "spring"] },
  { k: { zh: "艺术设计", en: "Arts" }, kws: ["gallery", "museum", "art", "design", "theater", "sculpture"] },
  { k: { zh: "夜生活", en: "Nightlife" }, kws: ["night", "club", "bar ", "live", "dj"] },
];
const KW_POOL = ["music", "jazz", "vinyl", "beer", "cocktail", "coffee", "wine", "barbecue", "taco", "night", "gallery", "museum", "park", "trail", "market", "theater", "beach", "club"];

function synthProfile(pool) {
  const n = pool.length;
  const counts = (type) => {
    const c = {};
    pool.forEach((p) => (p.tags || []).forEach((t) => { if (t.type === type && t.name) c[t.name] = (c[t.name] || 0) + 1; }));
    return c;
  };
  const top = (c, k) => Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, k);
  const blobOf = (p) => (String(p.name || "") + " " + (p.tags || []).map((t) => t.name || "").join(" ")).toLowerCase();
  const kws = {};
  pool.forEach((p) => { const b = blobOf(p); KW_POOL.forEach((w) => { if (b.includes(w)) kws[w] = (kws[w] || 0) + 1; }); });
  const domains = DOMAIN_BARS.map((d) => {
    const cnt = pool.filter((p) => d.kws.some((w) => blobOf(p).includes(w))).length;
    // 每个品类各自的命中关键词计数（top3）——六域注脚不再共用一张关键词表
    const hits = {};
    pool.forEach((p) => {
      const b = blobOf(p);
      d.kws.forEach((w) => { if (b.includes(w)) hits[w] = (hits[w] || 0) + 1; });
    });
    const note = Object.entries(hits).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, c]) => `${w} ×${c}`).join(" / ");
    return { k: d.k, v: Math.min(96, Math.round(55 + (n ? (cnt / n) * 45 : 0))), note };
  }).sort((a, b) => b.v - a.v);
  return {
    n,
    intent: top(counts(PROFILE_TAG_TYPES.intent), 1)[0] || null,
    tod: top(counts(PROFILE_TAG_TYPES.tod), 1)[0] || null,
    ages: top(counts(PROFILE_TAG_TYPES.age), 3),
    cust: top(counts(PROFILE_TAG_TYPES.custom), 3),
    keywords: top(kws, 6),
    domains,
  };
}

/* ── 池子清洗：基础设施实体（机场/车站/大学/政府）不进画像与任何选位。
   实测 Miami 裸搜 top16 里混着两座机场，污染关键词统计并挤掉消费场所 ── */
const INFRA_NAME = /(airport|university|college|hospital|city hall|courthouse|government|department of|administration|\bstation\b|terminal\b|port authority|transit|railway|metrorail|seaport|cruise|municipal|public library|police|fire station)/i;
const cleanPool = (list) => (list || []).filter((p) => !INFRA_NAME.test(p.name || ""));

/* ── /api/plan 主链（本地 server 与云端函数共用；返回 {code, body}） ── */
/* 限流 120 次/时/IP：公开部署防滥用；放宽阈值是因为多位评委可能共享同一出口 IP */
const RATE_LIMIT = new Map(); // ip → {n, at}
export async function handlePlan({ q = "", brand = "", lang = "zh", ip = "local" } = {}) {
  q = String(q).trim().slice(0, 200);
  brand = String(brand).trim().slice(0, 300);
  lang = lang === "en" ? "en" : "zh";
  const deny = (code, error, extra) => ({ code, body: { ok: false, error, ...(extra || {}) } });
  if (!q) return deny(400, { zh: "缺少地址参数 q", en: "Missing q (address)" });
  if (!resolveApiKey()) return deny(503, { zh: "服务端未配置 Qloo key", en: "Qloo key not configured on server" });
  if (ip !== "local") {
    const rl = RATE_LIMIT.get(ip) || { n: 0, at: Date.now() };
    if (Date.now() - rl.at > 3600e3) { rl.n = 0; rl.at = Date.now(); }
    if (++rl.n > 120) return deny(429, { zh: "请求过于频繁，一小时后再试", en: "Too many requests — try again in an hour" });
    RATE_LIMIT.set(ip, rl);
  }
  const cacheKey = q + "|" + brand;
  const hit = PLAN_CACHE.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL) return { code: 200, body: hit.json };

  let calls = 0;
  try {
    // 第一波全并行：定位 / 气质解析 / 三域池 / 周边品牌池（云端每跳 ~1.5s，
    // 串行链 10s+；全并行后整段只花最慢一跳的时间）
    // 注：artist/brand 不做过滤尝试（实测 URN 几乎不命中，气质对这两域
    // 走亲和排序；place 过滤保留——真实命中时 trace 如实标注）
    const qNorm = normQuery(q) || q;
    const [resolved, brandParse, placeUnf, musicRaw, brandsRaw, merchRaw] = await Promise.all([
      resolveAnywhere(qNorm),
      parseBrandOpen(brand, tags),
      insights({ filterType: "urn:entity:place", take: 16, locationQuery: qNorm, minPopularity: 0.25 }).then((r) => r.results).catch(() => []),
      insights({ filterType: "urn:entity:artist", take: 10, locationQuery: qNorm }).then((r) => r.results).catch(() => []),
      insights({ filterType: "urn:entity:brand", take: 10, locationQuery: qNorm }).then((r) => r.results).catch(() => []),
      insights({ filterType: "urn:entity:brand", take: 6, locationQuery: qNorm, tags: "urn:tag:genre:brand:fashion" }).then((r) => r.results).catch(() => []),
    ]);
    calls += 5; // 定位 + 三域 + 周边品牌池（气质解析的 tags 调用不计入口径）

    // 第二跳（仅 1 次调用）：place 域携气质 URN 过滤——用第一波拿齐的完整
    // URNs（词典 + 开放词汇）做单次过滤尝试，空则回退未过滤池并如实标注
    const dictHits = brandParse.hits.filter((c) => !c.open);
    const urns = {
      place: tagUrnsForDomain(brandParse.hits, "place"),
      artist: tagUrnsForDomain(brandParse.hits, "artist"),
      brand: tagUrnsForDomain(brandParse.hits, "brand"),
    };
    const filtered = {
      artist: urns.artist.length ? false : null,
      brand: urns.brand.length ? false : null,
      place: null,
    };
    let poolRaw = placeUnf;
    if (urns.place.length) {
      calls++;
      try {
        const r = await insights({ filterType: "urn:entity:place", take: 16, locationQuery: qNorm, tags: urns.place.join(",") });
        if (r.results.length) { filtered.place = true; poolRaw = r.results; }
        else filtered.place = false;
      } catch { filtered.place = false; }
    }
    const pool = cleanPool(poolRaw);
    // 基础池：未过滤池常驻（过滤生效时保类别多样性，未生效时与 pool 同源，前端去重）
    const basePool = cleanPool(placeUnf);
    // 周边商品池：品牌域 fashion URN 过滤的真实产品品牌
    const merchBrands = merchRaw;
    const music = musicRaw;
    const brands = brandsRaw;

    // S4 · 匹配度：气质与选址并行参与——URN 精确重合 + 标签名亲和（回退池也能得分）。
    // 计算域 = 过滤池 ∪ 基础池（去重）：个性真实命中过滤池时 fit>0 且对同一地点稳定；
    // 纯 basePool 会漏掉"存在但不在热门前16"的命中者（出现 fit 0% 与 filter applied 并存的悖论）
    const fitPoolMap = {};
    basePool.concat(pool).forEach((p) => { if (p && p.name && !fitPoolMap[p.name]) fitPoolMap[p.name] = p; });
    const fitPool = Object.values(fitPoolMap);
    const brandUrnsAll = [...new Set([...urns.place, ...urns.artist, ...urns.brand])];
    const matchedTags = [];
    let fitEntities = 0;
    if (brandUrnsAll.length) {
      const urnSet = new Set(brandUrnsAll);
      const stems = new Map(); // URN 末段（budget/design/quiet…）→ 对应 URN
      brandUrnsAll.forEach((u) => {
        const s = u.split(":").pop().replace(/_/g, " ");
        if (s.length >= 4) stems.set(s, u);
      });
      const tagCount = {};
      fitPool.forEach((p) => {
        let carried = false;
        (p.tags || []).forEach((t) => {
          const tn = (t.name || "").toLowerCase();
          let urn = urnSet.has(t.id) ? t.id : null;
          let byName = null;
          if (!urn) {
            for (const [stem, u] of stems) if (tn && tn.includes(stem)) { byName = u; break; }
          }
          if (urn || byName) {
            carried = true;
            const key = urn || byName;
            if (!tagCount[key]) tagCount[key] = { name: t.name || key.split(":").pop(), count: 0, first: p.name };
            tagCount[key].count++;
          }
        });
        if (carried) fitEntities++;
      });
      Object.entries(tagCount).forEach(([urn, v]) => matchedTags.push({ urn, name: v.name, count: v.count, firstEntity: v.first }));
    }
    const fit = { score: fitPool.length ? Math.round((fitEntities / fitPool.length) * 100) : 0, matchedTags };

    const profile = synthProfile(basePool);
    // 无个性输入时，色板由街区领先兴趣域推导（不再默认 graphite——否则
    // 有/无个性两次的视觉完全一样，气质层看起来没参与）
    const DOMAIN_PALETTE = { Outdoors: "forest", Nightlife: "neon", Drinks: "marine", Dining: "terra", Music: "ember", Arts: "ink" };
    const palette = dictHits.length
      ? paletteFor(dictHits)
      : PALETTES[DOMAIN_PALETTE[profile.domains[0]?.k?.en] || "graphite"];

    const out = {
      ok: true,
      lang,
      q, brand,
      resolved,
      brandParse: {
        raw: brandParse.raw,
        openWords: brandParse.openWords || [],
        hits: brandParse.hits.map((c) => ({
          slug: c.slug,
          label: c.label,
          open: c.open || undefined,
          kw: [...new Set([
            ...c.en,
            ...[...(c.tags.place || []), ...(c.tags.artist || []), ...(c.tags.brand || [])]
              .map((u) => u.split(":").pop().replace(/_/g, " ")),
          ])].filter((w) => w.length >= 4),
        })),
        urns,
        palette,
      },
      filtered,
      pool, basePool, merchBrands, music, brands,
      profile,
      fit,
      meta: { base: DEFAULT_BASE, ts: new Date().toISOString(), calls },
    };
    PLAN_CACHE.set(cacheKey, { json: out, at: Date.now() });
    return { code: 200, body: out };
  } catch (err) {
    if (err.message === "unresolved" || err.message === "unresolved:sugg") {
      return deny(404, { zh: "无法识别该地址，试试「城市, 州」或 POI 名", en: "Could not resolve this address; try 'City, ST' or a POI name" }, { suggestions: err.suggestions || [] });
    }
    return deny(502, { zh: "Qloo 上游错误：" + err.message.slice(0, 200), en: "Qloo upstream error: " + err.message.slice(0, 200) });
  }
}

/* 本地 server 的接口层 */
async function apiPlan(urlObj, res) {
  const r = await handlePlan({
    q: urlObj.searchParams.get("q") || "",
    brand: urlObj.searchParams.get("brand") || "",
    lang: urlObj.searchParams.get("lang") || "zh",
  });
  json(res, r.code, r.body);
}

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

/* 仅作为主程序直接运行时启动监听（被 Vercel 函数 import 时不监听） */
const __main = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (__main) {
  http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (urlObj.pathname === "/api/plan") apiPlan(urlObj, res).catch((e) => json(res, 500, { ok: false, error: String(e) }));
    else serveStatic(req, res, urlObj.pathname);
  }).listen(PORT, process.env.HOST || "127.0.0.1", () => {
    console.log(`[tastekey] http://127.0.0.1:${PORT}  ·  /api/plan?q=<地址>&brand=<气质>  ·  key=${resolveApiKey() ? "OK" : "MISSING"}`);
  });
}
