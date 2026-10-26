/* ═══ TasteKey · i18n 双语字符串表 ═══════════════════════════════
 * 终版切全英文：改 DEFAULT_LANG 为 "en"（或访问者用 ?lang=en 即时切换）。
 * 界面无任何虚构预设内容——所有方案数据来自实时 Qloo 调用。
 * 模板占位 {x} 由调用方填充。
 * ═════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var DEFAULT_LANG = "en";

  var STRINGS = {
    /* ── 输入区 ── */
    addrPh: {
      zh: "城市 / 地址 / 店名 — 如 600 Congress Ave, Austin 或 Bourbon Street, New Orleans",
      en: "City, address, or POI — e.g. 600 Congress Ave, Austin, or Bourbon Street, New Orleans",
    },
    brandPh: {
      zh: "用一句话描述你的酒店气质 — 如：安静的设计型酒店，客群偏商务（可留空）",
      en: "Describe your hotel's personality in one line — e.g. A quiet design hotel for business travelers (optional)",
    },
    runtimeBtn: { zh: "② 实时分析这个位置", en: "② Analyze this location live" },
    analyzing: { zh: "实时分析中…", en: "Analyzing live…" },
    runLabel: { zh: "Agent 工作中…", en: "Agent working…" },
    runtimeBadge: { zh: "LIVE · Realtime", en: "LIVE · Realtime" },
    needBackend: {
      zh: "实时分析需要本地后端：在 tastekey 目录运行 node server-http.mjs 后重试",
      en: "Live analysis needs the local backend: run node server-http.mjs in the tastekey dir, then retry",
    },
    addrUnresolved: {
      zh: "未能识别该地址，试试「城市, 州」或地标名",
      en: "Could not resolve that address; try 'City, ST' or a landmark name",
    },
    suggestions: { zh: "你是不是要找：", en: "Did you mean:" },

    /* ── 方案区块标题 ── */
    secMinibar: { zh: "Minibar 选品", en: "Minibar Picks" },
    secPlaylist: { zh: "客房歌单", en: "In-Room Playlist" },
    secWelcome: { zh: "欢迎礼遇", en: "Welcome Ritual" },
    secMerch: { zh: "周边胶囊", en: "Retail Capsule" },
    secVibe: { zh: "空间氛围指令", en: "Spatial Vibe Brief" },
    secExp: { zh: "本地体验推荐卡", en: "Local Experience Cards" },
    subMinibar: { zh: "每一格货架都有 Qloo 数据背书", en: "Every shelf slot backed by Qloo data" },
    subPlaylist: { zh: "由该位置的高亲和艺术家实时生成", en: "Generated live from high-affinity local artists" },
    subWelcome: { zh: "入住 10 分钟内的第一印象", en: "The first impression within 10 minutes of check-in" },
    subMerch: { zh: "前台货架 · 每件都替客人说出「我来过这里」", en: "Front-desk shelf · each piece says “I was here”" },
    subVibe: { zh: "给店长的落地参数", en: "Concrete parameters for the GM" },
    subExp: { zh: "Concierge 卡内容 · 来自 Qloo 街区场所真值", en: "Concierge cards · from live Qloo venues" },
    opsTakeaway: { zh: "运营要点：", en: "Ops takeaway: " },
    planTitle: { zh: "整店体验方案", en: "Store Experience Plan" },
    scentLabel: { zh: "香氛：", en: "Scent: " },
    matLabel: { zh: "材质与灯光：", en: "Materials & light: " },

    /* ── 运行时五步 ── */
    rtS1: { zh: "定位位置实体", en: "Resolve location entity" },
    rtS2: { zh: "品牌气质解析 × 街区画像", en: "Brand personality × neighborhood profile" },
    rtS3: { zh: "气质过滤取候选", en: "Gather tag-filtered candidates" },
    rtS4: { zh: "气质 × 街区匹配校验", en: "Brand-fit cross check" },
    rtS5: { zh: "组装整店方案", en: "Compose the store plan" },
    rtS1reason: { zh: "location 文本由 Qloo 解析为同一实体，全链同锚", en: "Qloo resolved the location text to one entity; the whole run shares this anchor" },
    rtS2reason: { zh: "气质→概念→Qloo 标签；街区画像由全部场所的标签统计合成", en: "Personality → concepts → Qloo tags; the block profile is synthesized from all venues' tags" },
    rtS3reason: { zh: "filter.tags 携气质标签过滤三类实体；空结果自动回退全部场所并如实标注", en: "filter.tags applies personality tags across entity types; empty results fall back to all venues, flagged" },
    rtS4reason: { zh: "气质与选址并行：标签精确重合 + 标签名亲和给全部场所排序，两个信号都参与每个选位", en: "Personality and location in parallel: exact tag overlap plus tag-name affinity ranks every venue — both signals drive every slot" },
    rtS5reason: { zh: "每件产出可回链到 S2-S4 的真实证据", en: "Every deliverable traces back to S2–S4 evidence" },
    rtMatchedConcepts: { zh: "命中概念", en: "matched concepts" },
    rtNoMatch: { zh: "（未命中词典概念 · 已按城市通用口味分析）", en: "(no dict concepts matched · analyzed on general city taste)" },
    rtNoBrandInput: { zh: "（未输入气质 · 按街区本味分析）", en: "(no personality given · composed on the block's own taste)" },
    rtFilterOn: { zh: "过滤生效", en: "filter applied" },
    rtFilterOff: { zh: "回退全部场所", en: "fell back to all venues" },
    rtFilterNone: { zh: "未启用", en: "not applicable" },
    rtFit: { zh: "气质×街区匹配度", en: "brand-fit" },
    rtPool: { zh: "街区场所", en: "block venues" },
    rtBrands: { zh: "本地品牌", en: "local brands" },
    rtSynth: { zh: "画像合成", en: "profile-derived" },
    rtKeywords: { zh: "域关键词", en: "domain keywords" },

    /* ── 方案合成模板 ── */
    tplHeadline: {
      zh: "这条街由 {dom1} 与 {dom2} 主导——「{brand}」气质匹配 {fit}%。",
      en: "This block reads {dom1} + {dom2} — your “{brand}” personality fits at {fit}%.",
    },
    tplHeadlineNo: {
      zh: "这条街由 {dom1} 与 {dom2} 主导（未输入气质，按街区本味合成）。",
      en: "This block reads {dom1} + {dom2} (no personality given — composed on the block's own taste).",
    },
    deltaTitle: { zh: "个性改变了什么", en: "What your personality changed here" },
    deltaOrder: { zh: "货架首位：{a} → {b}（个性亲和重排）", en: "Shelf top: {a} → {b} (personality re-ranked)" },
    deltaFilter: { zh: "气质标签过滤真实命中 {n} 家场所", en: "personality tag filter matched {n} venues" },
    deltaFit: { zh: "气质×街区匹配度 {fit}%（无个性时为 0 基线）", en: "brand-fit {fit}% (0 without personality)" },
    deltaNone: { zh: "个性对本街区影响有限——以上即街区本味。", en: "Personality has limited effect on this block — this is the block as-is." },
    deltaNoPers: { zh: "未输入气质——以下展示街区本味。", en: "No personality given — showing the block as-is." },
    exportBtn: { zh: "⤓ 导出采购清单 (.txt)", en: "⤓ Export procurement list (.txt)" },
    evidenceLabel: { zh: "数据出处", en: "evidence" },
    evPop: { zh: "人气", en: "pop" },
    swapBtn: { zh: "换一个", en: "swap" },
    boundaryTracks: {
      zh: "Qloo 返回的是艺人而非单曲——TasteKey 不编造曲目。",
      en: "Qloo returns artists, not individual tracks — TasteKey doesn't fabricate song titles.",
    },
    boundaryPrice: {
      zh: "Qloo 无菜单与价格数据——采购量与定价由酒店填写。",
      en: "Qloo has no menu or pricing data — quantities and pricing are the hotel's call.",
    },
    progS1: { zh: "正在解析地点…", en: "Resolving location…" },
    progS2: { zh: "正在解析气质…", en: "Reading personality…" },
    progS3: { zh: "正在拉取街区场所…", en: "Gathering block venues…" },
    progS4: { zh: "正在计算匹配度…", en: "Scoring fit…" },
    progS5: { zh: "正在组装方案…", en: "Composing the plan…" },
    tplSummary: {
      zh: "街区的口味由 Qloo 实时解析：{domains} 领先；你的「{brand}」气质与街区匹配度 {fit}%。",
      en: "Neighborhood taste resolved live from Qloo: {domains} lead the mix; your “{brand}” personality fits this block at {fit}%.",
    },
    tplNoBrandSummary: {
      zh: "街区的口味由 Qloo 实时解析：{domains} 领先（未输入气质，按街区本味合成）。",
      en: "Neighborhood taste resolved live from Qloo: {domains} lead the mix (no personality given, composed on the block's own taste).",
    },
    tplInsight: {
      zh: "到访意图以 {intent} 为主、{tod} 时段最活跃——气质选品全部围绕这两条真实信号。",
      en: "Visit intent skews {intent} and peaks at {tod} — every personality-driven pick follows these two live signals.",
    },
    tplInsightNoProfile: {
      zh: "画像标签稀疏，选品以场所人气与气质概念为准。",
      en: "Profile tags are sparse; picks follow pool popularity and personality concepts.",
    },
    tplPlaylistName: { zh: "{city} · {dom}长波", en: "{city} · the {dom} long wave" },
    tplPlaylistDesc: {
      zh: "按街区画像实时合成：{kw1} 多一点，{kw2} 少一点。",
      en: "Composed live from the block profile: more {kw1}, less {kw2}.",
    },
    kwDefault: { zh: "套路", en: "cliché" },
    tplKwConcept: { zh: "{kw}主导的街区口味", en: "a {kw}-led block taste" },
    tplWelcomeName: { zh: "「{concept}」欢迎盘", en: "The “{concept}” Welcome Ritual" },
    welcomeNoBrand: { zh: "街区本味开场", en: "Block's-own opening" },
    tplMinibarWhy: {
      zh: "Qloo 品牌亲和 {pop} 分位 · {concept}气质背书",
      en: "Qloo brand affinity {pop}th pct · backed by the {concept} personality",
    },
    tplMinibarWhyPlace: {
      zh: "出自街区场所真值 · 「{concept}」气质对位",
      en: "From the block's live venues · matched to the “{concept}” personality",
    },
    tplVenueProduct: { zh: "{venue} 同款{product}", en: "{venue} {product}" },
    tplMerchBrandWhy: {
      zh: "本地真品牌 · 前台货架选品 · {tags}",
      en: "Real local brand on the front-desk shelf · {tags}",
    },
    tplMinibarShelf: {
      zh: "本地同款上架 · 这街区把 {tag} 当母语",
      en: "Local favorite on the shelf · this block speaks {tag}",
    },
    /* 数据洞察引擎：全部由街区场所池的标签统计生成 */
    tplWhyRare: { zh: "街区唯一「{tag}」——别家没有", en: "The block's only “{tag}” — no one else has it" },
    tplWhyShared: { zh: "这条街 {total} 家热门场所里 {n} 家都主打「{tag}」——本地母语级", en: "{n} of {total} hot spots on this block lead with “{tag}” — mother-tongue local" },
    tplWhyPopular: { zh: "Qloo 人气 {pop} 分位——街区真值", en: "Qloo popularity {pop}th pct — a true local signal" },
    tplSynthItem: { zh: "本地{kw}小批量单品", en: "Small-batch local {kw}" },
    tplSynthMerch: { zh: "本地{kw}主题伴手礼", en: "Local {kw}-themed keepsake" },
    /* 画像合成的具体单品名（不做"精选/合集"这种品类词） */
    tplSynCoffee: { zh: "本地烘豆冷萃罐", en: "Local-roast cold-brew can" },
    tplSynCocktail: { zh: "本地调酒师预调瓶", en: "Local bartender's bottled cocktail" },
    tplSynWine: { zh: "本地酒庄半瓶装", en: "Local winery half-bottle" },
    tplSynBeer: { zh: "本地精酿联名罐", en: "Local craft collab can" },
    tplSynTea: { zh: "本地茶庄冷泡瓶", en: "Local tea-house cold-brew" },
    tplSynSnack: { zh: "本地小食拼盘", en: "Local snack board" },
    tplSynBakery: { zh: "本地烘焙坊点心盒", en: "Local bakery box" },
    tplSynBrunch: { zh: "本地早午餐招牌小份", en: "Local brunch spot's signature, mini" },
    tplSynBbq: { zh: "本地烟熏小食包", en: "Local smokehouse snack pack" },
    tplSynTaco: { zh: "本地塔可酱＋玉米片套装", en: "Local taco kit" },
    rtOpenNote: { zh: "（开放词汇实时命中：{words}）", en: " (open-vocabulary live hits: {words})" },
    trWhyLabel: { zh: "▸ 理由 · ", en: "▸ Why · " },
    trNoArgs: { zh: "（无参数）", en: "(no args)" },
    tplStapleWhy: { zh: "街区画像「{domain}」域领先 · 基础款补位", en: "“{domain}” leads the block profile · staple backfill" },
    tplSynthWhy: {
      zh: "街区画像「{kw}」×{n} 家场所命中 · 按画像合成",
      en: "Neighborhood profile: “{kw}” hits {n} venues · synthesized from the profile",
    },
    tplTrackWhy: { zh: "该位置高亲和艺术家", en: "High-affinity local artist" },
    tplWelcomeWhy: {
      zh: "把「{concept}」气质拆成三件可触摸的东西，气质×街区匹配度 {fit}% 是选品依据。",
      en: "The “{concept}” personality made tangible in three objects; picks guided by a {fit}% brand-fit score.",
    },
    tplWelcomeWhyNoBrand: {
      zh: "按街区真实口味拆出的三件开场物，成本可控、拍照率优先。",
      en: "Three opener objects from the block's real taste; cost-controlled, camera-first.",
    },
    tplExpWhy: { zh: "街区真值 · {tags}", en: "From the block · {tags}" },
    tplCopyBrand: {
      zh: "把{city}的{kw}带进大堂——{concept}，但要带着这个街区的口音。",
      en: "Bring {city}'s {kw} into the lobby — {concept}, spoken with this block's accent.",
    },
    tplCopyNoBrand: {
      zh: "住进{city}的B面——{kw}才是这里的母语。",
      en: "Stay on the B-side of {city} — {kw} is the local dialect.",
    },
    colorDescTpl: { zh: "{concepts} × {city}", en: "{concepts} × {city}" },
    genericConcept: { zh: "通用口味", en: "general taste" },

    /* ── 静态外壳（data-i18n）── */
    heroTitle: {
      zh: "把门外的街区口味，<em>编程</em>进你的酒店",
      en: "Program the <em>neighborhood's taste</em> into your hotel",
    },
    heroSub: {
      zh: "输入任意位置与酒店气质，Agent 实时调取 Qloo 品味图谱，合成整店体验方案——minibar、歌单、欢迎礼、周边、氛围与体验卡，每一件都有数据出处。",
      en: "Type any location and your hotel's personality — an agent queries the Qloo Taste Graph live and composes a whole-store plan: minibar, playlist, welcome ritual, retail capsule, vibe and experience cards, every pick traceable to data.",
    },
    tagline: { zh: "整店体验编程引擎 — 把每家酒店当成本地货架来编程", en: "The store-experience programming engine — every hotel, programmed like a local shelf" },
    stepPick: { zh: "① 输入任意位置与酒店气质", en: "① Type any location & hotel personality" },
    quickPicks: { zh: "试搜：", en: "Try:" },
    historyLabel: { zh: "搜索过：", en: "Searched:" },
    clearHistory: { zh: "清空", en: "Clear" },
    compareTitle: { zh: "你搜过的街区 · 真实数据对比", en: "Blocks you searched · real-data comparison" },
    compareEmpty: { zh: "先搜索两个城市，这里会出现它们的真实数据对比。", en: "Search two cities first — their real-data comparison shows up here." },
    cmpBrand: { zh: "输入的气质", en: "Personality input" },
    cmpMinibar: { zh: "MINIBAR 第一件", en: "FIRST MINIBAR PICK" },
    cmpDomains: { zh: "街区画像 TOP 域", en: "TOP PROFILE DOMAINS" },
    cmpPlaylist: { zh: "歌单", en: "PLAYLIST" },
    cmpPalette: { zh: "空间色板", en: "PALETTE" },
    cmpCopy: { zh: "门店文案", en: "STORE COPY" },
    backTop: { zh: "↑ 再搜一个位置", en: "↑ Search another location" },
    footer: {
      zh: "所有方案数据均来自 Qloo Taste Graph 实时接口 · 每句话都能在右侧 Agent 轨迹里回查到出处",
      en: "Every plan is composed from live Qloo Taste Graph data · every line traces back through the agent trace panel",
    },
    rtPairEvidence: { zh: "与 {name} 同标签（真值物证）", en: "same tag as {name} (hard evidence)" },
    rtPairCount: { zh: "{name} ×{count}——该街区多家场所携带（未进本方案货架，仅作画像证据）", en: "{name} ×{count} — carried by venues across the block (evidence only, not on this plan's shelf)" },
    viewPlan: { zh: "单店方案", en: "Single store" },
    viewCompare: { zh: "搜索对比", en: "Compare searches" },
    traceTitle: { zh: "Agent 推理轨迹", en: "Agent reasoning trace" },
    traceFoot: {
      zh: "五步全部来自后端对 Qloo 的实时调用，参数与结果可逐条对回",
      en: "All five steps come from live Qloo calls made by the backend; every arg and result can be traced back",
    },
    runtimeNotice: { zh: "以下方案由实时 Qloo 数据合成", en: "Composed from live Qloo data below" },
  };

  var lang = DEFAULT_LANG;
  try {
    var m = /[?&]lang=(zh|en)/.exec(location.search);
    if (m) lang = m[1];
    else if (localStorage.getItem("tk-lang")) lang = localStorage.getItem("tk-lang");
  } catch (e) { /* file:// 下 localStorage 可能不可用 */ }

  function t(key) {
    var row = STRINGS[key];
    if (!row) return key;
    return row[lang] || row.zh || key;
  }
  function tFill(key, vars) {
    var s = t(key);
    Object.keys(vars || {}).forEach(function (k) { s = s.split("{" + k + "}").join(String(vars[k])); });
    return s;
  }

  function applyStatic() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (STRINGS[key]) nodes[i].innerHTML = t(key); // 文案均为本表常量（可含 <em> 等标记）
    }
    var ph = document.querySelectorAll("[data-i18n-ph]");
    for (var j = 0; j < ph.length; j++) {
      var pk = ph[j].getAttribute("data-i18n-ph");
      if (STRINGS[pk]) ph[j].setAttribute("placeholder", t(pk));
    }
  }

  window.I18N = { lang: lang, t: t, tFill: tFill, applyStatic: applyStatic };
})();
