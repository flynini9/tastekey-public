/* ═══ TasteKey · 运行时方案合成器 ═══════════════════════════════
 * 把 /api/plan 的实时 Qloo 响应合成为两类产物：
 *   1. toModel(j)  → 与 index.html DATA 同构的方案模型（renderPlanHTML 直渲）
 *   2. toSteps(j)  → 五步 Agent 轨迹（S1-S5 全真值，交给 AgentTrace.runRuntime）
 * 文案全部走 I18N（zh/en 双语模板）。
 * ═════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var t = function (k) { return window.I18N ? I18N.t(k) : k; };
  var tf = function (k, v) { return window.I18N ? I18N.tFill(k, v) : k; };
  var L = function () { return window.I18N ? I18N.lang : "zh"; };

  var POP_KWS = { music: 1, jazz: 1, coffee: 1, beer: 1, cocktail: 1, wine: 1, park: 1, gallery: 1, museum: 1, market: 1, barbecue: 1, taco: 1, night: 1, vinyl: 1 };

  /* ── 商品位规则：minibar / 欢迎盘只上「具体产品」 ──
   * minibar 是房间里给客人的酒水小吃——条目必须是产品名：
   *   1) Qloo 品牌域里的消费产品品牌（Theo Chocolate/Zatarain's）直接就是产品
   *   2) 餐饮场所一律转成「{venue} 同款{产品}」表述（Urth Caffe 同款冷萃罐）
   *   3) 品牌域混有媒体/博物馆/球队（NYC 实测：New Yorker、MoMA、NYT），
   *      名字或标签碰机构黑名单一律不上架
   *   4) 仍不足额 → 画像关键词合成具体单品，如实标注「画像合成」
   */
  var CONSUMABLE = /(coffee|espresso|matcha|\btea\b|beer|\bale\b|brew|cider|wine|cocktail|spirit|whisk|vodka|\brum\b|\bgin\b|\bsake\b|juice|kombucha|\bsoda\b|bakery|bakehouse|patisserie|dessert|pastry|donut|doughnut|ice cream|gelato|chocolate|confection|candy|roaster|distiller|cheese|snack|brunch|breakfast|taco|barbecue|\bbbq\b|kitchen|cafe|café|diner|eatery|restaurant|\bfood\b|dining|noodle|ramen|sushi|seafood|\bmarket\b|grocer|\bdeli\b|creamery|\bbar\b|tavern|\bpub\b|bistro|cantina|taqueria|pizzeria|coffeehouse)/i;
  var NON_CONSUMABLE = /(museum|magazine|newspaper|\btimes\b|\bgazette\b|press\b|broadcast|network|\bmedia\b|\bapp\b|software|platform|booking|reservation|reserv|\bdelivery\b|imagery|visuals|interface|\bcontent\b|fintech|financial|university|college|\bschool\b|library|institute|foundation|hall of fame|\bfc\b|\bteam\b|league|stadium|arena|airline|airways|railway|\bbank\b|insurance|telecom|studio|theater|theatre|cinema|\bopera\b|symphony|orchestra|\bzoo\b|aquarium|planetarium|observatory|botanical|government|department|ministry|council|association|society|festival|\bchannel\b|\brecords\b|entertainment|production|publishing|\bradio\b|\btv\b|\bnba\b|\bnfl\b|\bmls\b)/i;

  function consumableTag(e) {
    var tags = (e && e.tags) || [];
    for (var i = 0; i < tags.length; i++) {
      var nm = tags[i] && tags[i].name;
      if (nm && CONSUMABLE.test(nm)) return nm;
    }
    return "";
  }

  /* 品牌 → 具体周边产品（品牌自带标签定品类：Klarra 带 Footwear → "Klarra 鞋"） */
  var MERCH_NOUNS = [
    [/footwear|shoes|sneaker/i, "鞋", "shoes"],
    [/bags?|leather|luggage/i, "皮质手袋", "leather bag"],
    [/jewel/i, "首饰", "jewelry"],
    [/eyewear|optical|glasses/i, "眼镜", "eyewear"],
    [/denim|jeans/i, "丹宁裤", "denim"],
    [/swim/i, "泳衣", "swimwear"],
    [/activewear|sportswear|athleisure/i, "运动衣", "activewear"],
    [/fragrance|perfume|scent/i, "香水", "fragrance"],
    [/candle/i, "香薰蜡烛", "candles"],
    [/homeware|home decor|interior/i, "家居小物", "home goods"],
    [/stationery/i, "文具", "stationery"],
    [/watch/i, "腕表", "watch"],
    [/apparel|clothing|fashion|wear/i, "服饰", "apparel"],
  ];
  function merchNounFor(tagStr) {
    for (var i = 0; i < MERCH_NOUNS.length; i++) {
      if (MERCH_NOUNS[i][0].test(tagStr || "")) return L() === "en" ? MERCH_NOUNS[i][2] : MERCH_NOUNS[i][1];
    }
    return L() === "en" ? "limited-edition piece" : "限定单品";
  }

  /* ── 数据洞察引擎：why 文案由 Qloo 池内标签二阶加工生成 ──
   * 稀有度（全池唯一 → "这一带只此一家"）/ 共现（×N 家 → "本地母语级"）/
   * 分位（人气真值）。不掺任何人工内容，每句可回链 S3 池子。 */
  var GENERIC_TAG = /(wheelchair|restroom|accessible|seating|parking|group|event|midday|central|clean|modern|reservation|book tonight|star|discover|trending|popular|great|good|best|award|hidden gem|iconic|classic|authentic)/i;
  function mineWhy(entity, stats, poolSize, tag) {
    var tags = ((entity && entity.tags) || []).map(function (x) { return x && x.name || ""; })
      .filter(function (n) { return n && !GENERIC_TAG.test(n); });
    // 稀有：池内唯一的描述性标签——独立成句，不再叠货架句
    for (var i = 0; i < tags.length; i++) {
      if ((stats[tags[i]] || 0) === 1) return tf("tplWhyRare", { tag: tags[i] });
    }
    // 共现：街区多店共享的主标签，取计数最高
    var best = null, bestN = 1;
    tags.forEach(function (n) { var c = stats[n] || 0; if (c > bestN) { best = n; bestN = c; } });
    if (best) return tf("tplWhyShared", { tag: best, n: bestN, total: poolSize });
    // 分位兜底：接货架句补语境
    return tf("tplWhyPopular", { pop: pct(entity && entity.popularity) }) +
      (tag ? " · " + tf("tplMinibarShelf", { tag: tag }) : "");
  }

  /* 标签 → 场景词（预设版的货架语感：社交传播/宵夜场景/次日刚需…） */
  var SCENE_BY_TAG = [
    [/(cocktail|full bar|sports bar|lounge bar|\bbar\b|spirits|whisk|vodka|night)/i, "微醺开场", "evening opener"],
    [/(coffee|espresso)/i, "次日刚需", "next-morning fix"],
    [/(craft beer|\bbeer\b|brew)/i, "社交传播", "social currency"],
    [/wine/i, "客房夜谈", "nightcap talk"],
    [/\btea\b|matcha/i, "晨间仪式", "morning ritual"],
    [/(bak|brunch|breakfast|donut|pastry)/i, "晨间场景", "morning scene"],
    [/(dining|restaurant|soul food|seafood|steak|bbq|barbecue|taco|food|noodle|hot ?pot|dim ?sum)/i, "深夜补给", "late-night fuel"],
    [/(market|grocer|deli)/i, "伴手礼", "take-home"],
    [/juice|soda|kombucha/i, "泳池场景", "poolside"],
  ];
  function sceneFor(tagStr) {
    for (var i = 0; i < SCENE_BY_TAG.length; i++) {
      if (SCENE_BY_TAG[i][0].test(tagStr || "")) return L() === "en" ? SCENE_BY_TAG[i][2] : SCENE_BY_TAG[i][1];
    }
    return L() === "en" ? "local pick" : "本地同款";
  }

  /* 标签 → 具体产品名词（场所转产品表述用） */
  var PRODUCT_NOUNS = [
    [/(cocktail|full bar|sports bar|lounge bar|\bbar\b|spirits|whisk|vodka)/i, "预调鸡尾酒", "bottled cocktail"],
    [/(coffee|espresso)/i, "冷萃罐", "cold-brew can"],
    [/(craft beer|\bbeer\b|brew)/i, "精酿罐", "craft can"],
    [/wine/i, "半瓶红酒", "half-bottle"],
    [/\btea\b|matcha/i, "冷泡瓶", "cold-brew bottle"],
    [/(bak|brunch|breakfast|donut|pastry)/i, "招牌烘焙盒", "bake box"],
    [/(dining|restaurant|eatery|soul food|seafood|steak|bbq|barbecue|taco|food|noodle|hot ?pot|dim ?sum|crab|laksa)/i, "招牌小食拼盘", "snack board"],
    [/(market|grocer|deli)/i, "市集选物盒", "market picks box"],
    [/juice|soda|kombucha/i, "果气泡饮", "sparkling juice"],
  ];
  function nounFor(tagName) {
    var zh = "招牌单品", en = "house special";
    for (var i = 0; i < PRODUCT_NOUNS.length; i++) {
      if (PRODUCT_NOUNS[i][0].test(tagName || "")) { zh = PRODUCT_NOUNS[i][1]; en = PRODUCT_NOUNS[i][2]; break; }
    }
    return L() === "en" ? en : zh;
  }
  var VENUISH_BRAND = /(dining|restaurant|\bbar\b|brunch|seafood|bake|cafe|eatery|brewery|taqueria|market|grocer|supermarket|\bstore\b|kitchen)/i;
  function brandShelfable(b) {
    var blob = (b && b.name || "") + " " + ((b && b.tags) || []).map(function (x) { return x && x.name || ""; }).join(" ");
    if (NON_CONSUMABLE.test(blob)) return false; // 名字或标签带媒体/机构/App 一律不上架
    if (anyTag(b, RETAIL)) return false; // 连锁超市/卖场不是 minibar 商品（H-E-B/Whole Foods）
    if (VENUISH_BRAND.test(blob)) return true; // 餐饮品牌 → 转成「同款产品」表述上架
    return !!consumableTag(b) || CONSUMABLE.test(b && b.name || "");
  }

  /* ── 场所分类器：每个方案位只从语义正确的类别取数 ──
   * minibar/欢迎盘←consumable · 周边←retail · 体验←musicvenue/outdoor/culture
   * 住宿（竞争对手酒店）与机场/大学等设施一律不上任何推荐位。
   */
  var LODGING = /(hotel|inn\b|motel|hostel|resort|lodge|suites|marriott|hilton|hyatt|wyndham|sheraton|ritz|holiday inn|best western|radisson|comfort inn|fairfield|courtyard|hampton inn|doubletree|embassy|aloft|four points|la quinta|super 8|days inn|motel 6|travelodge|ascend hotel|bed ?n ?breakfast|b ?& ?b\b)/i;
  var RETAIL = /(shop|store|market\b|supermarket|department store|boutique|gift|souvenir|bookstore|book shop|record|vinyl|\bmall\b|outlet|emporium|grocery|deli\b|bazaar|florist|newsstand|confection|shopping|\bretail\b)/i;
  var MUSICVENUE = /(\bmusic\b|live music|jazz|blues|concert|venue|\bclub\b|arena|stadium|\bhall\b)/i;
  var OUTDOOR = /(park|garden|trail|beach|lake|river|bayou|mountain|preserve|refuge|wildlife|nature|greenway|waterfall|boardwalk|pier\b|bridge|lookout|scenic|swim)/i;
  var CULTURE = /(museum|gallery|\bart\b|arts\b|theater|theatre|cinema|opera|symphony|orchestra|historic|heritage|landmark|monument|memorial|cemetery|church|cathedral|basilica|temple|zoo|aquarium|planetarium|observatory|library|architecture|castle|palace|statue|exhibit|winery|brewery|distillery|tour\b)/i;
  var INFRA = /(airport|\blaunch\b|marina|\bport\b|station|terminal|rail|\bbus\b|university|college|\bschool\b|hospital|government|courthouse|city hall|\boffice\b|\bbank\b|parking|convention|civic)/i;

  /* 强吃喝信号：名字直接是吃喝（Eataly/Blue Bottle），或标签强吃喝且
   * 名字不是公园/广场/场馆（Westlake Park 带 market 标签也不进货架——
   * 公园归体验卡）。market 标签单独不够强。 */
  var STRONG_FOOD = /(market|cafe|café|coffee|espresso|kitchen|eatery|food|seafood|creamery|bak|brew|cidery|distillery|winery|tavern|\bbar\b|\bpub\b|bistro|diner|restaurant|grill|roast|donut|doughnut|pizzeria|taqueria|cantina|\bdeli\b|juice|\btea\b|chocolate|confection|ice cream|gelato|brunch|\bbbq\b|barbecue|steakhouse|ramen|sushi|noodle|\bpho\b|\btaco\b|burrito|burger|sandwich|\bpie\b|\bcake\b|candy|\bsnack\b|dining|cocktail|spirits|whisk|vodka|grocer|gastro)/i;
  var PLACEISH = /(park|garden|trail|beach|lake|preserve|refuge|river|bayou|mountain|island|square|plaza|pier\b|boardwalk|bridge|cemetery|church|cathedral|temple|monument|memorial|library|airport|station|university|college|convention|civic|aquarium|planetarium|observatory|stadium|arena|amphithe|pavilion|city hall|hall of)/i;

  function tagBlob(e) {
    var names = ((e && e.tags) || []).map(function (x) { return (x && x.name || "") + " "; }).join("");
    return names + " " + (e && e.name || "");
  }
  function anyTag(e, re) {
    return ((e && e.tags) || []).some(function (x) { return x && x.name && re.test(x.name); });
  }
  function classify(e) {
    var nm = (e && e.name) || "";
    var blob = tagBlob(e);
    var foodTag = anyTag(e, STRONG_FOOD);
    var retailish = RETAIL.test(nm) || anyTag(e, RETAIL);
    if (LODGING.test(blob)) return "lodging";
    if (INFRA.test(blob)) return "infra";
    // 名字即吃喝（Eataly / Grand Central Market）优先于零售判定
    if (STRONG_FOOD.test(nm) && !NON_CONSUMABLE.test(nm)) return "consumable";
    if (foodTag && !PLACEISH.test(nm) && !retailish && !NON_CONSUMABLE.test(nm)) return "consumable";
    if (retailish && !PLACEISH.test(nm) && !NON_CONSUMABLE.test(nm)) return "retail";
    if (MUSICVENUE.test(blob)) return "musicvenue";
    if (OUTDOOR.test(blob)) return "outdoor";
    if (CULTURE.test(blob)) return "culture";
    return "other";
  }

  /* ── 气质 × 选址并行：全池按气质亲和排序（回退/未过滤池照样受气质影响） ── */
  function kwFromHits(j) {
    var kws = [];
    ((j.brandParse && j.brandParse.hits) || []).forEach(function (h) {
      (h.kw || []).forEach(function (w) { if (kws.indexOf(w.toLowerCase()) < 0) kws.push(w.toLowerCase()); });
    });
    return kws;
  }
  function affinity(e, kws) {
    if (!kws.length) return 0;
    var blob = tagBlob(e).toLowerCase();
    var s = 0;
    for (var i = 0; i < kws.length; i++) if (blob.indexOf(kws[i]) >= 0) s += 2;
    return s;
  }
  function rankPool(pool, kws) {
    return (pool || []).slice().sort(function (a, b) {
      return affinity(b, kws) - affinity(a, kws) || (b.popularity || 0) - (a.popularity || 0);
    });
  }

  /* 歌单只收音乐人：Qloo artist 域混有演员/模特/视觉艺术家。
   * 两档：① 有真实音乐风格标签且非视觉艺术 → 音乐人；
   *       ② 不足 6 人时用其余补位到 6（音乐人恒排前），多出的演员/艺术家丢弃。 */
  var MUSIC_GENRE = /(rock|\bpop\b(?! ?(culture|art))|jazz|hip ?hop|r ?& ?b|r&b|soul|funk|country|folk|blues|electronic|\bedm\b|\brap\b|indie|metal|punk|reggae|latin|classical|\bband\b|vocal|singer|guitar|drum|piano|\bdj\b|producer|bounce|brass|orchestra|rapper|ensemble|quartet|trio|gospel|bluegrass|tejano|zydeco|synth|\btrap\b|ballad|\balbum\b|songwriter|mpb|salsa|reggaeton|afrobeat)/i;
  var VISUAL_ART = /(pop art|contemporary art|modern art|street art|sculptor|painter|illustrat|visual art|manga|anime)/i;
  function musiciansOf(list) {
    var all = list || [];
    var keep = all.filter(function (a) {
      return (anyTag(a, MUSIC_GENRE) || MUSIC_GENRE.test(a.name || "")) && !anyTag(a, VISUAL_ART);
    });
    if (keep.length >= 6) return keep;
    var pad = all.filter(function (a) { return keep.indexOf(a) < 0; })
      .sort(function (a, b) { return (anyTag(b, MUSIC_GENRE) ? 1 : 0) - (anyTag(a, MUSIC_GENRE) ? 1 : 0); });
    return keep.concat(pad.slice(0, 6 - keep.length));
  }

  function topTagsOf(entity, n) {
    return ((entity && entity.tags) || [])
      .map(function (x) { return x && x.name; })
      .filter(function (nm) { return nm && !GENERIC_TAG.test(nm); })
      .slice(0, n || 3)
      .join(" · ");
  }
  function conceptLabels(j) {
    return j.brandParse.hits.map(function (h) { return h.label[L()] || h.label.zh; });
  }
  function pct(p) { return Math.round((p || 0) * 100); }
  function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ── 请求（后端不可达返回 null，调用方降级） ── */
  function fetchPlan(q, brand) {
    var url = "/api/plan?q=" + encodeURIComponent(q) + "&brand=" + encodeURIComponent(brand || "") + "&lang=" + (L() === "en" ? "en" : "zh");
    return fetch(url, { signal: AbortSignal.timeout(45000) })
      .then(function (res) { return res.json(); })
      .then(function (j) { return j && j.ok ? j : { ok: false, error: j && j.error, suggestions: j && j.suggestions }; });
  }

  /* ── DATA 同构模型 ── */
  function toModel(j) {
    var city = j.resolved.name;
    // 位置行去重压缩：Qloo 消歧串常重复（"Washington, D.C., Washington, D.C., United States…"）
    var stateCompact = (j.resolved.disambiguation || city).split(",")
      .map(function (s) { return s.trim(); })
      .filter(function (p, i, a) { return p && a.map(function (x) { return x.toLowerCase(); }).indexOf(p.toLowerCase()) === i; })
      .join(", ");
    var labels = conceptLabels(j);
    var hasBrand = labels.length > 0;
    var topKw = (j.profile.keywords[0] || [])[0] || "";
    // 货架文案用的气质短语：没输气质时不露「通用口味」这种机制词，改用街区关键词
    var brandText = hasBrand ? labels.join(" + ") : tf("tplKwConcept", { kw: cap1(topKw) || city });
    var pal = j.brandParse.palette || {};
    var colors = pal.colors || ["#1F4B43", "#C96F2E", "#E8D5B7", "#20221F"];
    var topKw = (j.profile.keywords[0] || [])[0] || "";

    // 画像条（六域，带关键词注）
    var kws = j.profile.keywords.map(function (k) { return k[0]; }).join(" / ");
    var domains = j.profile.domains.map(function (d) {
      return [d.k[L()] || d.k.zh, d.v, d.note || ""];
    });

    // 全池按气质亲和排序：地址（Qloo 选址池）与气质（关键词亲和）从这一步起并行参与。
    // 过滤生效时 j.pool 类别单一（全是命中 URN 的场所），并入 basePool 保住
    // 体验/周边位的类别多样性；去重后 URN 携带者自然排前（亲和分更高）。
    var kws = kwFromHits(j);
    var seen = {};
    var merged = [];
    (j.pool || []).concat(j.basePool && j.basePool.length && j.basePool !== j.pool ? j.basePool : []).forEach(function (p) {
      var key = p.id || p.name;
      if (!key || seen[key]) return;
      seen[key] = 1;
      merged.push(p);
    });
    var ranked = rankPool(merged, kws);

    // Minibar = 具体产品：① 产品品牌（Theo Chocolate 这种）② 场所转「同款产品」 ③ 画像合成
    // why 全部由 Qloo 数据二阶加工生成（共现/稀有度/分位），不掺人工内容
    var minibar = [];
    var tagStats = {};
    (j.pool || []).forEach(function (p) {
      (p.tags || []).forEach(function (x) { if (x && x.name) tagStats[x.name] = (tagStats[x.name] || 0) + 1; });
    });
    (j.brands || []).forEach(function (b) {
      if (minibar.length >= 6 || !brandShelfable(b)) return;
      var tag = consumableTag(b);
      var venuish = VENUISH_BRAND.test((b.tags || []).map(function (x) { return x && x.name || ""; }).join(" "));
      minibar.push([
        venuish ? tf("tplVenueProduct", { venue: b.name, product: nounFor(tag || b.name) }) : b.name,
        tf("tplMinibarWhy", { pop: pct(b.popularity), concept: brandText }),
        sceneFor(tag || b.name),
        { e: b.name, tags: topTagsOf(b, 2), pop: pct(b.popularity) },
      ]);
    });
    ranked.forEach(function (p) {
      if (minibar.length >= 6 || classify(p) !== "consumable") return;
      var tag = consumableTag(p);
      minibar.push([
        tf("tplVenueProduct", { venue: p.name, product: nounFor(tag || (p.name || "")) }),
        mineWhy(p, tagStats, (j.pool || []).length, tag),
        sceneFor(tag || (p.name || "")),
        { e: p.name, tags: topTagsOf(p, 3), pop: pct(p.popularity) },
      ]);
    });
    // 画像关键词合成兜底：条目必须是具体单品（"精选/合集"这种品类词不要）
    var SYNTH_TPL = {
      coffee: "tplSynCoffee", espresso: "tplSynCoffee", cocktail: "tplSynCocktail", wine: "tplSynWine",
      beer: "tplSynBeer", tea: "tplSynTea", market: "tplSynSnack", food: "tplSynSnack", dining: "tplSynSnack",
      bakery: "tplSynBakery", brunch: "tplSynBrunch", barbecue: "tplSynBbq", bbq: "tplSynBbq", taco: "tplSynTaco",
    };
    (j.profile.keywords || []).forEach(function (k) {
      if (minibar.length >= 6) return;
      var kw = k && k[0];
      if (!kw || !CONSUMABLE.test(kw)) return;
      var tpl = SYNTH_TPL[kw.toLowerCase()];
      minibar.push([tpl ? t(tpl) : tf("tplSynthItem", { kw: cap1(kw) }), tf("tplSynthWhy", { kw: kw, n: k[1] }), sceneFor(kw)]);
    });
    // 池内消费场所稀缺时（Miami 裸搜实测被机场挤占），按领先兴趣域补基础款到 4 格
    if (minibar.length < 4) {
      var domTop = (j.profile.domains[0] || {}).k;
      var STAPLE_SCENE = { tplSynCoffee: "coffee", tplSynBeer: "beer", tplSynSnack: "dining", tplSynWine: "wine" };
      ["tplSynCoffee", "tplSynBeer", "tplSynSnack", "tplSynWine"].forEach(function (tpl) {
        if (minibar.length >= 4) return;
        var name = t(tpl);
        if (minibar.some(function (m) { return m[0] === name; })) return;
        minibar.push([name, tf("tplStapleWhy", { domain: (domTop && (domTop[L()] || domTop.zh)) || t("genericConcept") }), sceneFor(STAPLE_SCENE[tpl])]);
      });
    }

    // 欢迎礼：取货架前三件（都是可消费实体）
    var welcomeItems = minibar.slice(0, 3).map(function (m) { return m[0]; });
    if (welcomeItems.length < 3) {
      ranked.forEach(function (p) { if (welcomeItems.length < 3 && classify(p) !== "lodging") welcomeItems.push(p.name); });
    }

    // 周边胶囊 = 该地特色具体商品：本地产品品牌 + 标签定品类 → "Club 21 皮质手袋"
    var used = {}; // 跨选位去重：同一实体不重复占两个推荐位
    minibar.forEach(function (m) { used[m[0]] = 1; });
    var merch = (j.merchBrands || []).slice(0, 3).map(function (b) {
      used[b.name] = 1;
      return [b.name + " " + merchNounFor(topTagsOf(b, 4)),
              tf("tplMerchBrandWhy", { tags: topTagsOf(b, 2) }),
              { e: b.name, tags: topTagsOf(b, 3), pop: pct(b.popularity) }];
    });
    (j.profile.keywords || []).forEach(function (k) {
      if (merch.length >= 3) return;
      var kw = k && k[0];
      if (!kw) return;
      merch.push([tf("tplSynthMerch", { kw: cap1(kw) }), tf("tplSynthWhy", { kw: kw, n: k[1] }), t("rtSynth")]);
    });

    // 体验卡：音乐场 / 户外 / 文化类（排除住宿、设施，以及已占位的实体）；
    // 该地缺文化类场所时（新加坡实测池内全是餐饮/商业），用知名餐厅补位——
    // 礼宾卡推荐探访名店本身成立
    var experiences = ranked.filter(function (p) {
      if (used[p.name]) return false;
      var c = classify(p);
      return c === "musicvenue" || c === "outdoor" || c === "culture";
    }).slice(0, 4).map(function (p) {
      // 地址门：Qloo 地址缺街道号（只有州/邮编）时不展示，宁缺毋假
      var addr = (p.properties && p.properties.address && /\d/.test(p.properties.address)) ? " · " + p.properties.address : "";
      return [p.name + addr, tf("tplExpWhy", { tags: topTagsOf(p, 3) }), { e: p.name, tags: topTagsOf(p, 3), pop: pct(p.popularity) }];
    });
    if (experiences.length < 4) {
      ranked.forEach(function (p) {
        if (experiences.length >= 4 || used[p.name]) return;
        if (classify(p) !== "consumable") return;
        used[p.name] = 1;
        var addr = p.properties && p.properties.address ? " · " + p.properties.address : "";
        experiences.push([p.name + addr, tf("tplExpWhy", { tags: topTagsOf(p, 3) })]);
      });
    }

    var intentName = j.profile.intent ? j.profile.intent[0] : "";
    var todName = j.profile.tod ? j.profile.tod[0] : "";
    var insight = (intentName || todName)
      ? tf("tplInsight", { intent: intentName || "-", tod: todName || "-" })
      : t("tplInsightNoProfile");

    var domainStr = j.profile.domains.slice(0, 3).map(function (d) { return (d.k[L()] || d.k.zh) + " " + d.v; }).join(" / ");

    // 备选队列：同类可消费场所（swap 按钮的货源），与在架品同样挂证据
    var onShelf = {};
    minibar.forEach(function (m) { if (m[3] && m[3].e) onShelf[m[3].e] = 1; });
    var alts = [];
    ranked.forEach(function (p) {
      if (alts.length >= 4 || onShelf[p.name]) return;
      if (classify(p) !== "consumable") return;
      var tag = consumableTag(p);
      alts.push([
        tf("tplVenueProduct", { venue: p.name, product: nounFor(tag || (p.name || "")) }),
        mineWhy(p, tagStats, (j.pool || []).length, tag),
        sceneFor(tag || (p.name || "")),
        { e: p.name, tags: topTagsOf(p, 3), pop: pct(p.popularity) },
      ]);
    });

    // 个性增量（诚实面板的数据源，零额外调用）
    var popTop = (j.pool && j.pool[0] && j.pool[0].name) || "";
    var affTop = (ranked[0] && ranked[0].name) || "";

    return {
      name: city,
      state: stateCompact,
      color: colors[0],
      colorDesc: tf("colorDescTpl", { concepts: brandText, city: city }),
      delta: {
        hasBrand: hasBrand,
        brandText: brandText,
        openN: (j.brandParse.openWords || []).length,
        orderChanged: hasBrand && affTop !== popTop,
        topPop: popTop,
        topAff: affTop,
        filterApplied: j.filtered.place === true,
        filterN: j.filtered.place === true ? (j.pool || []).length : 0,
        fit: j.fit.score,
      },
      _alts: alts,
      profile: {
        summary: hasBrand
          ? tf("tplSummary", { domains: domainStr, brand: j.brandParse.raw, fit: j.fit.score })
          : tf("tplNoBrandSummary", { domains: domainStr }),
        domains: domains,
        insight: insight,
      },
      minibar: minibar,
      playlist: {
        name: tf("tplPlaylistName", { city: city, dom: (j.profile.domains[0] || {}).k ? ((j.profile.domains[0].k[L()] || j.profile.domains[0].k.zh)) : "" }),
        desc: tf("tplPlaylistDesc", {
          kw1: cap1(topKw) || city,
          kw2: cap1((j.profile.keywords[1] || [])[0] || "") || t("kwDefault"),
        }),
        tracks: musiciansOf(j.music).slice(0, 10).map(function (a) { return a.name; }),
      },
      welcome: {
        name: tf("tplWelcomeName", { concept: hasBrand ? labels[0] : t("welcomeNoBrand") }),
        items: welcomeItems,
        why: hasBrand
          ? tf("tplWelcomeWhy", { concept: labels.join(" + "), fit: j.fit.score })
          : t("tplWelcomeWhyNoBrand"),
      },
      merch: merch,
      vibe: {
        palette: colors,
        scent: (pal.scent && (pal.scent[L()] || pal.scent.zh)) || "",
        material: (pal.material && (pal.material[L()] || pal.material.zh)) || "",
      },
      experiences: experiences,
      copy: hasBrand
        ? tf("tplCopyBrand", { city: city, kw: cap1(topKw) || labels[0], concept: labels.join(" + ") })
        : tf("tplCopyNoBrand", { city: city, kw: cap1(topKw) || city }),
      _fit: j.fit.score,
    };
  }

  /* ── 五步轨迹（全真值） ── */
  function filterState(v) { return v === true ? t("rtFilterOn") : v === false ? t("rtFilterOff") : t("rtFilterNone"); }

  function toSteps(j) {
    var labels = conceptLabels(j);
    var hasBrand = labels.length > 0;
    var dom = function (key) { return (j[key] || []).length; };
    var topPool = rankPool((j.pool || []).concat(j.basePool && j.basePool !== j.pool ? j.basePool : [])
      .filter(function (p, i, a) { return a.findIndex(function (q2) { return (q2.id || q2.name) === (p.id || p.name); }) === i; }), kwFromHits(j))
      .slice(0, 4).map(function (p) { return p.name; });
    var ages = j.profile.ages.map(function (a) { return a[0].replace(" ", "–") + " ×" + a[1]; });
    var cust = j.profile.cust.map(function (a) { return a[0] + " ×" + a[1]; });
    var profileLines = [];
    if (j.profile.intent) profileLines.push((L() === "en" ? "Intent " : "意图 ") + j.profile.intent[0] + " " + Math.round(j.profile.intent[1] / Math.max(1, j.profile.n) * 100) + "%");
    if (j.profile.tod) profileLines.push((L() === "en" ? "Peak " : "时段 ") + j.profile.tod[0] + " " + Math.round(j.profile.tod[1] / Math.max(1, j.profile.n) * 100) + "%");
    if (ages.length) profileLines.push((L() === "en" ? "Ages " : "年龄带 ") + ages.join(" / "));
    if (cust.length) profileLines.push((L() === "en" ? "Guests " : "客群 ") + cust.join(" / "));

    var urnSummary = ["place", "artist", "brand"].map(function (k) {
      return k + "=" + (j.brandParse.urns[k] || []).length;
    }).join(", ");

    var model = toModel(j);
    // S4 物证只引用真正进入方案的场所（评审抓的点：硬证据不能指鹿为马）；
    // 没有任何在架场所携带该标签时，按计数陈述而不指名
    var usedBlob = (model.minibar.map(function (x) { return x[0]; }).join(" ") + " " +
      model.welcome.items.join(" ") + " " + model.merch.map(function (x) { return x[0]; }).join(" ") + " " +
      model.experiences.map(function (x) { return x[0]; }).join(" ")).toLowerCase();
    return [
      {
        id: "resolve_location", label: t("rtS1"),
        args: { query: j.q, types: "urn:entity:locality", take: 3 },
        result: { entity: String(j.resolved.id).slice(0, 8).toUpperCase(), name: j.resolved.name, anchor: j.resolved.disambiguation },
        reason: t("rtS1reason"),
      },
      {
        id: "parse_brand", label: t("rtS2"),
        args: { brand: j.brandParse.raw || "∅", dict: "≈34 concepts", urns: urnSummary },
        result: {
          matched: labels.length
            ? t("rtMatchedConcepts") + ": " + labels.join(" / ") +
              ((j.brandParse.openWords || []).length ? " " + tf("rtOpenNote", { words: j.brandParse.openWords.join(" / ") }) : "")
            : (j.brandParse.raw ? t("rtNoMatch") : t("rtNoBrandInput")),
          profile: profileLines.length ? profileLines : [t("tplInsightNoProfile")],
        },
        reason: t("rtS2reason"),
      },
      {
        id: "gather_filtered", label: t("rtS3"),
        args: { "signal.location.query": j.q, "filter.tags": urnSummary },
        result: {
          place: dom("pool") + " · " + filterState(j.filtered.place),
          artist: dom("music") + " · " + filterState(j.filtered.artist),
          brand: dom("brands") + " · " + filterState(j.filtered.brand),
          top: topPool.join(" / "),
        },
        reason: t("rtS3reason"),
      },
      {
        id: "brand_fit", label: t("rtS4"),
        args: { input: "brand URNs × pool tags" },
        result: {
          fit: t("rtFit") + " " + j.fit.score + "%",
          pairs: j.fit.matchedTags.length
            ? j.fit.matchedTags.map(function (mt) {
                var inPlan = (j.basePool || j.pool || []).filter(function (p) {
                  return p && usedBlob.indexOf((p.name || "").toLowerCase()) >= 0 &&
                    (p.tags || []).some(function (x) { return (x.name || "").toLowerCase() === mt.name.toLowerCase(); });
                })[0];
                return inPlan
                  ? mt.name + " ×" + mt.count + " → " + tf("rtPairEvidence", { name: inPlan.name })
                  : tf("rtPairCount", { name: mt.name, count: mt.count });
              })
            : [t("rtNoMatch")],
        },
        reason: t("rtS4reason"),
      },
      {
        id: "compose_plan", label: t("rtS5"),
        args: { input: "S2 + S3 + S4" },
        result: {
          store: model.name,
          plan: "minibar " + model.minibar.length + " / " + (L() === "en" ? "tracks " : "曲目 ") + model.playlist.tracks.length +
            " / " + (L() === "en" ? "exp " : "体验 ") + model.experiences.length + " / fit " + j.fit.score + "%",
        },
        reason: t("rtS5reason"),
      },
    ];
  }

  window.RuntimePlan = { fetchPlan: fetchPlan, toModel: toModel, toSteps: toSteps };
})();
