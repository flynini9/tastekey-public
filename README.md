# TasteKey

> **Program the neighborhood's taste into your hotel.**
> An agent workflow that turns the Qloo Taste Graph into a hotel's whole-store
> experience plan — any address, any personality, every pick traceable to live
> Qloo data.

<p>
  <a href="https://tastekey-qloo-mcp-rr5j.vercel.app/"><strong>✦ Live Demo</strong></a>
  &nbsp;·&nbsp;
  Powered by <a href="https://www.qloo.com/">Qloo Taste Graph</a> (250M+ cultural entities)
  &nbsp;·&nbsp;
  Qloo Agentic Hackathon entry
  &nbsp;·&nbsp;
  AGPL-3.0 License
</p>

---

## What it does

Type in **any address** and **a hotel personality in plain words** — a city, a
street address, even a point of interest — and TasteKey composes the whole
store around the taste of that block:

| Slot | What you get |
| --- | --- |
| 🛎️ **Minibar** | Concrete products, not categories — real product brands on the shelf |
| 🎵 **In-room playlist** | Artists who actually fit the block, not a generic genre mix |
| 🎁 **Welcome ritual** | A check-in gesture built from the same local picks |
| 🛍️ **Retail capsule** | Real local goods, category derived from their tags |
| 🕯️ **Spatial vibe** | Scent, light, texture — the room's atmosphere brief |
| 🗺️ **Experience cards** | Live-music, outdoor and culture venues worth sending guests to |

Every line is backed by evidence: open the **Agent Reasoning Trace** on the
right and each step shows its source. No hand-written content anywhere — the
copy is computed from Qloo data (rarity, co-occurrence, popularity
percentile), so a pick like *"the block's only 'Moist brisket' — no one else
has it"* is a statistic, not a slogan.

## Input model — any address × natural-language personality

- **Address:** free text, English or Chinese. Chinese city names are
  normalized to English before hitting Qloo, and fuzzy input resolves to the
  nearest real place, shown honestly in step S1.
- **Personality:** one line, e.g. *"a quiet design hotel for business
  travelers"*. ~34 curated concept words (including hotel categories: budget,
  hostel, B&B, hot spring…) map to hand-verified Qloo tag URNs — and **any
  other adjective is looked up live against `/v2/tags`** (open-vocabulary
  layer). *"Moody", "cozy", "industrial",* 温馨*,* 工业风 *— all become real
  URNs and really participate in filtering, affinity ranking and fit
  scoring. Personality and location act **in parallel** on every slot.
- **Bilingual:** English by default, `?lang=zh` switches to Chinese.
- **Compare:** every successful search is kept in a local history (max 6,
  stored only in your browser). From two searches on, the **Compare searches**
  view puts their real data side by side.

## How it works — the five-step trace

```text
  address + personality
        │
        ▼
  S1  resolve_location   anchor the place to a real Qloo entity
        │                (Chinese normalized first; fallback entities must
        │                 share tokens with the query — anti-drift)
        ▼
  S2  parse_brand        dictionary concepts + open-vocabulary live hits
        │                + block profile summary
        ▼
  S3  gather_filtered    filter.tags carries personality URNs;
        │                empty results fall back, flagged honestly
        ▼
  S4  brand_fit          exact tag overlap + tag-name affinity rank
        │                every venue; pairs cite the first venue
        │                carrying each tag
        ▼
  S5  compose_plan       assemble the plan — every deliverable traces
                         back to S2–S4 evidence
```

## Run it

### Local

```bash
node server-http.mjs
# → http://127.0.0.1:8765
```

Static page + `GET /api/plan?q=<any address|city|POI>&brand=<personality in
natural language>` — a live Qloo pipeline. The key lives only in the server
process and never reaches the browser.

### Vercel

The repo is wired for Vercel (`api/plan.mjs`, 60s max duration, per-IP rate
limit). Three settings matter — all three have bitten before:

1. **Root Directory: `./`** (the repo root — *not* `qloo-mcp/`, which holds
   only backend modules and has no page or API entrypoint).
2. **Framework Preset: Other.** Vercel auto-detects this repo as a Node
   server project and then demands a server entrypoint (`app.js`,
   `server.js`, …). TasteKey is a static page + one API function, so it must
   be **Other**.
3. **Environment Variable: `QLOO_API_KEY`.** Without it the page loads but
   every search returns 503 ("Qloo key not configured on server").


## Repo layout

```text
tastekey/
├── index.html          UI: search hero, history, compare wall, plan cards, trace panel (data-i18n)
├── server-http.mjs     Runtime backend: static serving + /api/plan (zero-dep Node;
│                       exports handlePlan shared by local & cloud)
├── api/plan.mjs        Vercel serverless entry (maxDuration 60s, per-IP rate limit)
├── i18n.js             zh/en string table (?lang= switches; DEFAULT_LANG for the final flip)
├── runtime-plan.js     Response → plan model + five-step trace (classifier, insight engine, open-vocab affinity)
├── agent-trace.js      Trace playback layer (all step data comes from live calls)
└── qloo-mcp/           Runtime backend modules
    ├── qloo-client.mjs REST client (search / insights / tags; honest error text)
    ├── brand-dict.mjs  Concept dictionary (34 concepts × bilingual × curated tag URNs) + open-vocabulary layer
    └── fixtures.mjs    Mock-mode fallback data (used only when QLOO_MOCK=1; the live site never touches it)
```

## Security discipline (Qloo SAFE_USE)

- **No credentials in the repo or the frontend bundle.** The key exists only
  in the server process / serverless env.
- Locally, export `QLOO_API_KEY` in your own terminal before running
  `node server-http.mjs` — never write the key into the repo.
- Agent discipline: no agent may ask for the key in chat or accept a pasted
  key; when a key is missing, point the user to setting `QLOO_API_KEY` (the
  page reports 503 "Qloo key not configured on server" without it).
- The browser keeps only your own search history (localStorage, CLEAR to
  wipe); the server logs neither your queries nor your IP — the IP is used
  only for in-memory rate limiting.

## License

AGPL-3.0 only — see [LICENSE](LICENSE). Copyright (C) 2026 TasteKey contributors.
