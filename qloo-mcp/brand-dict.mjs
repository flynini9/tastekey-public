// ─────────────────────────────────────────────────────────────
// TasteKey · 品牌气质概念词典（中英双语 → Qloo 标签 URN）
//
// 自然语言气质描述 → 命中概念 → 概念携带的标签 URN（按目标域精选：
// place 域只给场所实体真实携带的类型——ambience/decor/setting/genre:place/
// category:place/offerings:place/cuisine 等；artist 域只给 genre:music；
// brand 域只给 genre:brand。携带不了的 URN 过滤必空，2026-10 实测）。
//
// URN 全部来自 qloo_tags 实测（filter.query=概念词），可用性已验证。
// palette/flavor 为方案合成的氛围模板键。
// ─────────────────────────────────────────────────────────────

// 10 套策展色板（概念 → palette 名）
export const PALETTES = {
  graphite: { colors: ["#3A3F3B", "#C96F2E", "#E8E2D5", "#20221F"], scent: { zh: "雪松＋矿物感，极低浓度", en: "Cedar & mineral, barely there" }, material: { zh: "哑光石材、黑钢、原木；灯光 2700K", en: "Matte stone, blackened steel, raw wood; 2700K" } },
  forest:   { colors: ["#2F4B38", "#8A9B6E", "#E3DCC8", "#1F2E24"], scent: { zh: "冷杉针叶＋湿苔藓", en: "Fir needles & damp moss" }, material: { zh: "原木、亚麻、绿植墙；灯光 3000K", en: "Timber, linen, living walls; 3000K" } },
  ember:    { colors: ["#B3541E", "#7A2E12", "#E8D5B7", "#241711"], scent: { zh: "烟熏木质＋尾调皮革", en: "Smoked wood, leather finish" }, material: { zh: "做旧皮革、黄铜、旧木；灯光 2700K", en: "Aged leather, brass, reclaimed wood; 2700K" } },
  marine:   { colors: ["#1E3A4C", "#5B7065", "#D9D4C7", "#16232B"], scent: { zh: "海盐＋湿石头矿物感", en: "Sea salt & wet stone" }, material: { zh: "水磨石、羊毛毯、哑光金属；灯光 3000K 偏冷", en: "Terrazzo, wool, matte metal; cool 3000K" } },
  blush:    { colors: ["#E85D75", "#0FA3B1", "#F7D488", "#FDF6EC"], scent: { zh: "白花＋椰子，浓度给足", en: "White florals & coconut, generous" }, material: { zh: "藤编、镜面、水磨石；灯光 2200K 暖光", en: "Rattan, mirrors, terrazzo; warm 2200K" } },
  ink:      { colors: ["#1A1A18", "#4A4E45", "#D8D3C3", "#0D0D0B"], scent: { zh: "墨、纸、冷杉三笔带过", en: "Ink, paper, a stroke of fir" }, material: { zh: "深色木、黑框、艺术纸品；灯光 2700K", en: "Dark timber, black frames, art paper; 2700K" } },
  gold:     { colors: ["#20221F", "#B08D57", "#F1E9D7", "#141414"], scent: { zh: "沉香＋香槟气泡感", en: "Oud & champagne sparkle" }, material: { zh: "大理石、拉丝黄铜、丝绒；灯光 2400K", en: "Marble, brushed brass, velvet; 2400K" } },
  daylight: { colors: ["#F4EFE6", "#D9A441", "#7FA3A0", "#2B2B28"], scent: { zh: "柑橘＋青草，早晨的味道", en: "Citrus & cut grass, morning" }, material: { zh: "白橡木、棉麻、大窗自然光", en: "White oak, cotton-linen, daylight-first" } },
  neon:     { colors: ["#12101F", "#7B2FF7", "#F15946", "#0B0A14"], scent: { zh: "黑胡椒＋紫罗兰冷冽前调", en: "Black pepper & violet, sharp top" }, material: { zh: "黑镜面、亚克力、霓虹灯带；灯光可变", en: "Black glass, acrylic, neon strips; tunable" } },
  terra:    { colors: ["#8C4A32", "#D9A441", "#EFE3CE", "#3B2A20"], scent: { zh: "陶土＋干薰衣草", en: "Terracotta & dried lavender" }, material: { zh: "赤陶、手工织物、拱形线条", en: "Terracotta, handloom textiles, arches" } },
};

// 概念表：syn 为检索词（zh 子串匹配；en 词边界匹配，自动容复数）
export const CONCEPTS = [
  { slug: "design",     palette: "graphite", label: { zh: "设计感", en: "Design" },
    zh: ["设计", "设计感", "美学", "设计型"], en: ["design", "designer", "aesthetic"],
    tags: { place: ["urn:tag:decor:qloo:design", "urn:tag:category:place:design"] } },
  { slug: "minimalist", palette: "daylight", label: { zh: "极简克制", en: "Minimalist" },
    zh: ["极简", "性冷淡", "简约", "克制"], en: ["minimal", "minimalist", "understated"],
    tags: { place: ["urn:tag:decor:qloo:minimalist", "urn:tag:ambience:qloo:minimalist"] } },
  { slug: "vintage",    palette: "ember", label: { zh: "复古", en: "Vintage" },
    zh: ["复古", "怀旧", "老式", "古典"], en: ["vintage", "retro", "nostalgic"],
    tags: { place: ["urn:tag:decor:qloo:vintage", "urn:tag:ambience:qloo:vintage"] } },
  { slug: "art",        palette: "ink", label: { zh: "文艺艺术", en: "Art" },
    zh: ["艺术", "文艺", "画廊", "美术馆"], en: ["art", "artsy", "gallery", "creative"],
    tags: { place: ["urn:tag:genre:place:art_gallery", "urn:tag:category:place:art_gallery"] } },
  { slug: "business",   palette: "marine", label: { zh: "商务高效", en: "Business" },
    zh: ["商务", "高效", "办公", "差旅"], en: ["business", "work", "productive", "professional"],
    tags: { place: ["urn:tag:neighborhood_characteristic:qloo:business", "urn:tag:amenity:place:business"] } },
  { slug: "family",     palette: "daylight", label: { zh: "亲子友好", en: "Family" },
    zh: ["亲子", "家庭", "带娃", "孩子"], en: ["family", "kids", "children"],
    tags: { place: ["urn:tag:ambience:qloo:family_friendly", "urn:tag:neighborhood_characteristics:qloo:family_friendly"] } },
  { slug: "nature",     palette: "forest", label: { zh: "自然户外", en: "Nature" },
    zh: ["自然", "户外", "森林", "徒步", "山野"], en: ["nature", "outdoor", "hiking", "green"],
    tags: { place: ["urn:tag:setting:qloo:nature", "urn:tag:theme:qloo:nature"] } },
  { slug: "wellness",   palette: "daylight", label: { zh: "疗愈健康", en: "Wellness" },
    zh: ["疗愈", "养生", "健康", "瑜伽", "冥想"], en: ["wellness", "healthy", "healing", "mindful"],
    tags: { place: ["urn:tag:ambience:place:wellness", "urn:tag:category:place:wellness"] } },
  { slug: "spa",        palette: "forest", label: { zh: "水疗", en: "Spa" },
    zh: ["水疗", "spa", "按摩", "泡池"], en: ["spa", "massage", "hot spring"],
    tags: { place: ["urn:tag:amenity:place:spa", "urn:tag:category:place:spa"] } },
  { slug: "nightlife",  palette: "neon", label: { zh: "夜生活", en: "Nightlife" },
    zh: ["夜生活", "夜店", "酒吧街", "蹦迪"], en: ["nightlife", "clubbing", "late night"],
    tags: { place: ["urn:tag:genre:place:nightlife", "urn:tag:category:place:nightlife"] } },
  { slug: "cocktails",  palette: "gold", label: { zh: "鸡尾酒", en: "Cocktails" },
    zh: ["鸡尾酒", "调酒"], en: ["cocktail"],
    tags: { place: ["urn:tag:offerings:place:cocktails", "urn:tag:beverage_offerings:qloo:cocktails"] } },
  { slug: "craftbeer",  palette: "ember", label: { zh: "精酿", en: "Craft Beer" },
    zh: ["精酿", "啤酒", "酒花"], en: ["craft beer", "brewery", "ale"],
    tags: { place: ["urn:tag:offerings:place:craft_beer", "urn:tag:beverage_offerings:qloo:craft_beer"] } },
  { slug: "coffee",     palette: "terra", label: { zh: "咖啡", en: "Coffee" },
    zh: ["咖啡", "咖啡馆", "手冲"], en: ["coffee", "cafe", "espresso"],
    tags: { place: ["urn:tag:offerings:place:coffee", "urn:tag:category:place:coffee"] } },
  { slug: "vinyl",      palette: "ember", label: { zh: "黑胶唱片", en: "Vinyl" },
    zh: ["黑胶", "唱片", "磁带"], en: ["vinyl", "record"],
    tags: { place: ["urn:tag:decor:qloo:vinyl_record_themed"] } },
  { slug: "jazz",       palette: "ink", label: { zh: "爵士", en: "Jazz" },
    zh: ["爵士"], en: ["jazz", "blues", "soul"],
    tags: { place: [], artist: ["urn:tag:genre:music:jazz"] } },
  { slug: "livemusic",  palette: "neon", label: { zh: "现场音乐", en: "Live Music" },
    zh: ["现场音乐", "演出", "live"], en: ["live music", "gig", "concert", "band"],
    tags: { place: ["urn:tag:amenity:qloo:live_music", "urn:tag:ambience:qloo:live_music"] } },
  { slug: "historic",   palette: "ink", label: { zh: "历史底蕴", en: "Historic" },
    zh: ["历史", "底蕴", "古迹", "遗产"], en: ["historic", "heritage", "classic"],
    tags: { place: ["urn:tag:neighborhood_characteristic:qloo:historic", "urn:tag:ambience:qloo:historic"] } },
  { slug: "fashion",    palette: "neon", label: { zh: "时尚潮流", en: "Fashion" },
    zh: ["时尚", "潮流", "买手", "穿搭"], en: ["fashion", "trendy", "stylish", "boutique shopping"],
    tags: { place: ["urn:tag:category:place:fashion"], brand: ["urn:tag:genre:brand:fashion"] } },
  { slug: "fitness",    palette: "marine", label: { zh: "健身运动", en: "Fitness" },
    zh: ["健身", "运动", "撸铁", "跑步"], en: ["fitness", "gym", "sport", "running", "athlete"],
    tags: { place: ["urn:tag:theme:qloo:fitness"] } },
  { slug: "sustainable", palette: "forest", label: { zh: "环保可持续", en: "Sustainable" },
    zh: ["环保", "可持续", "生态", "绿色"], en: ["sustainable", "eco", "green", "farm-to-table"],
    tags: { place: ["urn:tag:culinary_style:qloo:sustainable", "urn:tag:ambience:qloo:sustainable"] } },
  { slug: "luxury",     palette: "gold", label: { zh: "奢华高端", en: "Luxury" },
    zh: ["奢华", "高端", "精致", "轻奢"], en: ["luxury", "luxurious", "premium", "upscale", "five-star"],
    tags: { place: ["urn:tag:amenity:place:luxury", "urn:tag:decor:qloo:luxury"] } },
  { slug: "boutique",   palette: "terra", label: { zh: "精品", en: "Boutique" },
    zh: ["精品", "小而美"], en: ["boutique", "independent"],
    tags: { place: ["urn:tag:genre:place:boutique", "urn:tag:decor:qloo:boutique"] } },
  { slug: "romantic",   palette: "blush", label: { zh: "浪漫情侣", en: "Romantic" },
    zh: ["浪漫", "情侣", "约会", "蜜月"], en: ["romantic", "couple", "honeymoon", "date"],
    tags: { place: ["urn:tag:ambience:qloo:romantic"] } },
  { slug: "petfriendly", palette: "daylight", label: { zh: "宠物友好", en: "Pet Friendly" },
    zh: ["宠物", "携宠", "狗狗", "猫"], en: ["pet friendly", "dog friendly", "pets"],
    tags: { place: ["urn:tag:amenity:qloo:pet_friendly"] } },
  { slug: "coworking",  palette: "daylight", label: { zh: "联合办公", en: "Co-working" },
    zh: ["联合办公", "共享办公", "数字游民", "远程办公"], en: ["coworking", "co-working", "remote work", "digital nomad", "workspace"],
    tags: { place: ["urn:tag:category:place:coworking_space"] } },
  { slug: "breakfast",  palette: "terra", label: { zh: "早餐早午餐", en: "Brunch" },
    zh: ["早餐", "早午餐", "brunch"], en: ["breakfast", "brunch"],
    tags: { place: ["urn:tag:dining_options:place:breakfast", "urn:tag:genre:place:restaurant:breakfast"] } },
  { slug: "rooftop",    palette: "neon", label: { zh: "屋顶天台", en: "Rooftop" },
    zh: ["屋顶", "天台", "露台"], en: ["rooftop", "terrace", "skyline"],
    tags: { place: ["urn:tag:setting:qloo:rooftop", "urn:tag:amenity:place:rooftop_bar"] } },
  // 酒店品类词（2026-10 补：覆盖 快捷酒店/民宿/青旅 等常见类型输入）
  { slug: "budget",     palette: "daylight", label: { zh: "经济快捷", en: "Budget & Value" },
    zh: ["快捷", "经济", "性价比", "平价", "实惠", "便宜"], en: ["budget", "economy", "economical", "affordable", "value", "cheap", "express hotel"],
    tags: { place: ["urn:tag:amenity:place:budget", "urn:tag:ambience:qloo:budget"] } },
  { slug: "hostel",     palette: "terra", label: { zh: "青旅社交", en: "Hostel" },
    zh: ["青旅", "青年旅舍", "背包客", "床位房"], en: ["hostel", "backpacker"],
    tags: { place: ["urn:tag:genre:place:hotel:hostel", "urn:tag:category:place:hostel"] } },
  { slug: "motel",      palette: "neon", label: { zh: "公路汽车旅馆", en: "Motel" },
    zh: ["汽车旅馆", "路边旅馆"], en: ["motel", "motor lodge", "roadside"],
    tags: { place: ["urn:tag:category:place:motel", "urn:tag:genre:place:hotel:motel"] } },
  { slug: "bnb",        palette: "blush", label: { zh: "民宿温度", en: "B&B" },
    zh: ["民宿", "客栈", "家庭旅馆", "房东"], en: ["bed and breakfast", "b&b", "bnb", "guesthouse"],
    tags: { place: ["urn:tag:genre:place:hotel:bed_breakfast", "urn:tag:category:place:bed_breakfast"] } },
  { slug: "resort",     palette: "marine", label: { zh: "度假村式", en: "Resort" },
    zh: ["度假", "度假村", "亲水", "全包"], en: ["resort", "vacation", "all-inclusive"],
    tags: { place: ["urn:tag:amenity:place:resort"] } },
  { slug: "hotspring",  palette: "ember", label: { zh: "温泉疗愈", en: "Hot Spring" },
    zh: ["温泉", "泡汤", "汤池"], en: ["onsen"],
    tags: { place: ["urn:tag:category:place:hot_spring", "urn:tag:genre:place:hot_spring"] } },
  { slug: "quiet",      palette: "ink", label: { zh: "静谧安神", en: "Quiet" },
    zh: ["安静", "静谧", "清静", "闹中取静"], en: ["quiet", "peaceful", "serene", "tranquil", "calm"],
    tags: { place: ["urn:tag:ambience:qloo:quiet"] } },
];

// 自然语言 → 命中概念（zh 子串；en 词边界＋复数容错）。返回去重命中列表
export function parseBrandText(text) {
  const raw = String(text || "").trim();
  if (!raw) return { raw: "", hits: [] };
  const lower = raw.toLowerCase();
  const hits = [];
  for (const c of CONCEPTS) {
    const zhHit = c.zh.some((w) => raw.includes(w));
    const enHit = c.en.some((w) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${esc}(?:s|es|ing)?\\b`).test(lower);
    });
    if (zhHit || enHit) hits.push(c);
  }
  return { raw, hits };
}

// 命中概念 → 各域标签 URN（并集，上限 6 个／域——filter.tags 过多会过度收窄）
export function tagUrnsForDomain(hits, domain) {
  const urns = new Set();
  for (const c of hits) for (const u of c.tags[domain] || []) urns.add(u);
  return [...urns].slice(0, 6);
}

export function paletteFor(hits) {
  return PALETTES[hits[0]?.palette] || PALETTES.graphite;
}

// ─────────────────────────────────────────────────────────────
// 开放词汇层：任意形容词实时查 qloo_tags 参与计算
// 词典只是快路径（palette/文案模板）；未覆盖的词不再丢弃——
// zh 常用形容词 → en，en 直接查，命中真实 URN 就并入过滤与亲和集。
// ─────────────────────────────────────────────────────────────
export const OPEN_STOP = new Set([
  "hotel", "hotels", "motel", "inn", "resort", "hostel", "suite", "suites", "lodging",
  "vibe", "style", "styled", "feel", "feeling", "guests", "guest", "rooms", "room", "lobby",
  "brand", "personality", "very", "with", "and", "for", "the", "this", "that", "have", "more",
  "type", "kind", "like", "want", "need", "away", "from", "into",
]);

// zh 形容词 → en 查询词（只收词典未覆盖的；命中与否由 qloo_tags 实时裁决）
export const OPEN_ZH = {
  温馨: "cozy", 热闹: "lively", 优雅: "elegant", 典雅: "elegant", 高雅: "elegant",
  时髦: "trendy", 甜美: "sweet", 神秘: "mysterious", 奇幻: "whimsical", 童趣: "playful",
  趣味: "playful", 活力: "energetic", 动感: "dynamic", 沉稳: "sophisticated", 内敛: "understated",
  张扬: "bold", 大胆: "bold", 前卫: "edgy", 街头: "street", 波西米亚: "bohemian",
  日式: "japanese", 和风: "japanese", 法式: "french", 意式: "italian", 地中海: "mediterranean",
  热带: "tropical", 海洋: "nautical", 航海: "nautical", 乡村: "rustic", 田园: "pastoral",
  治愈: "healing", 松弛: "relaxed", 科技: "futuristic", 未来: "futuristic", 工业: "industrial",
  冷酷: "moody", 阴郁: "moody", 梦幻: "ethereal", 仙气: "ethereal", 清新: "fresh",
  明亮: "bright", 阳光: "sunny", 温暖: "warm", 冰冷: "cold", 硬朗: "rugged", 粗犷: "rugged",
};

const PLACE_TAG_TYPES = /^(ambience:qloo|ambience:place|decor:qloo|setting:qloo|theme:qloo|genre:place|category:place|offerings:place|amenity:place|neighborhood_characteristics?:qloo)/;

// 词级缓存（进程生命周期）：同一形容词不重复打 qloo_tags
const openCache = new Map();

export async function parseBrandOpen(text, tagsFn) {
  const base = parseBrandText(text);
  const openWords = [];
  if (!base.raw || typeof tagsFn !== "function") return { ...base, openWords };

  // 候选词：zh 词库最长匹配 + en 分词，词典已命中的概念词不重复查
  const covered = new Set(base.hits.flatMap((c) => [...c.zh, ...c.en.map((w) => w.split(" ")[0])]));
  let rest = base.raw;
  const cand = [];
  for (const k of Object.keys(OPEN_ZH).sort((a, b) => b.length - a.length)) {
    if (rest.includes(k) && !covered.has(k)) { cand.push(OPEN_ZH[k]); rest = rest.split(k).join(" "); }
  }
  const lower = base.raw.toLowerCase();
  for (const w of lower.split(/[^a-z&]+/)) {
    if (w.length >= 4 && !OPEN_STOP.has(w) && !covered.has(w) && !cand.includes(w)) cand.push(w);
  }

  const openHits = [];
  for (const w of cand.slice(0, 4)) {
    let urns = openCache.get(w);
    if (urns === undefined) {
      urns = null;
      try {
        const r = await tagsFn({ query: w, take: 6 });
        urns = r.results
          .filter((t) => PLACE_TAG_TYPES.test((t.entity_id || "").replace("urn:tag:", "")) && (t.name || "").toLowerCase().includes(w.slice(0, 4)))
          .slice(0, 3).map((t) => t.entity_id);
      } catch { urns = []; }
      openCache.set(w, urns);
    }
    if (urns && urns.length) {
      openWords.push(w);
      const zhLabel = Object.keys(OPEN_ZH).find((k) => OPEN_ZH[k] === w) || w;
      openHits.push({ slug: "open:" + w, palette: "", label: { zh: zhLabel, en: w }, zh: [], en: [w], tags: { place: urns }, open: true });
    }
  }
  return { raw: base.raw, hits: [...base.hits, ...openHits], openWords };
}
