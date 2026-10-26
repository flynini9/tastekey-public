// Vercel Serverless Function：GET /api/plan?q=<地址>&brand=<气质>&lang=<zh|en>
// 复用 server-http.mjs 导出的 handlePlan（本地 server 与云端同一条主链）。
// key 走 Vercel 环境变量 QLOO_API_KEY（控制台加密存储，绝不进仓库/浏览器）。
import { handlePlan } from "../server-http.mjs";

// 函数上限 60s（Hobby + Fluid 可用；默认 10s 在多调用冷路径上可能不够）
export const maxDuration = 60;

export default async function handler(req, res) {
  const url = new URL(req.url, "http://vercel.local");
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "vercel";
  try {
    const r = await handlePlan({
      q: url.searchParams.get("q") || "",
      brand: url.searchParams.get("brand") || "",
      lang: url.searchParams.get("lang") || "zh",
      ip,
    });
    res.statusCode = r.code;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(r.body));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: { zh: "函数内部错误", en: "Function internal error" } }));
  }
}
