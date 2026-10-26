// 仅用于 QLOO_MOCK=1 的本地仿真响应（结构仿 Qloo v2）
// 真数据永远来自 hackathon.api.qloo.com；这里只为无 key 机器能跑通全链路。

const CITIES = {
  "austin, tx": { id: "MOCK-LOCALITY-AUSTIN", name: "Austin", state: "TX" },
  "seattle, wa": { id: "MOCK-LOCALITY-SEATTLE", name: "Seattle", state: "WA" },
  "miami, fl": { id: "MOCK-LOCALITY-MIAMI", name: "Miami", state: "FL" },
};

const ENTITIES = {
  austin: {
    "urn:entity:artist": [
      ["Gary Clark Jr.", 0.91], ["Khruangbin", 0.89], ["Black Pumas", 0.87],
      ["Spoon", 0.82], ["White Denim", 0.79],
    ],
    "urn:entity:place": [
      ["Franklin Barbecue", 0.95], ["Veracruz All Natural", 0.9], ["La Barbecue", 0.88],
      ["Torchy's Tacos", 0.84], ["Uchi", 0.8],
    ],
    "urn:entity:brand": [
      ["Topo Chico", 0.93], ["Austin Beerworks", 0.87], ["Celis Brewery", 0.82],
      ["Real Ale Brewing", 0.78], ["Tito's Handmade Vodka", 0.76],
    ],
  },
  seattle: {
    "urn:entity:artist": [
      ["Fleet Foxes", 0.92], ["Death Cab for Cutie", 0.9], ["Modest Mouse", 0.88],
      ["Band of Horses", 0.85], ["Odesza", 0.82],
    ],
    "urn:entity:place": [
      ["Canlis", 0.94], ["Pike Place Chowder", 0.9], ["Taylor Shellfish Farms", 0.87],
      ["Matt's in the Market", 0.84], ["Din Tai Fung", 0.81],
    ],
    "urn:entity:brand": [
      ["Victrola Coffee Roasters", 0.93], ["Stumptown Coffee", 0.9], ["Rainier Beer", 0.85],
      ["Jones Soda", 0.8], ["Seattle Chocolate", 0.77],
    ],
  },
  miami: {
    "urn:entity:artist": [
      ["Bad Bunny", 0.96], ["KAROL G", 0.93], ["Rauw Alejandro", 0.9],
      ["Sech", 0.84], ["Bomba Estéreo", 0.8],
    ],
    "urn:entity:place": [
      ["Versailles Restaurant", 0.94], ["Joe's Stone Crab", 0.92], ["Coyo Taco", 0.88],
      ["La Mar by Gastón Acurio", 0.85], ["El Mago de las Fritas", 0.82],
    ],
    "urn:entity:brand": [
      ["Café Bustelo", 0.92], ["Vita Coco", 0.89], ["Bacardí", 0.87],
      ["Estrella Damm", 0.82], ["La Croix", 0.78],
    ],
  },
};

function cityKey(query = "") {
  const q = String(query).toLowerCase();
  for (const key of Object.keys(CITIES)) {
    if (q.includes(key.split(",")[0])) return key.split(",")[0];
  }
  return "austin";
}

function entityFor(city, filterType, name, popularity, i) {
  const subtype = filterType;
  return {
    entity_id: `MOCK-${city.toUpperCase()}-${filterType.split(":").pop()}-${i + 1}`,
    name,
    type: "urn:entity",
    subtype,
    popularity,
    tags: [
      { id: `urn:tag:mock:${city}`, name: `${city} local`, type: "urn:tag:mock" },
    ],
    properties: {
      description: `Mock entity for ${city} · ${filterType}`,
      geocode: { city: city[0].toUpperCase() + city.slice(1), country_code: "US" },
    },
  };
}

export function mockSearch(params = {}) {
  const q = String(params.query || "");
  const key = cityKey(q);
  const city = CITIES[key + ", " + (key === "austin" ? "tx" : key === "seattle" ? "wa" : "fl")] || CITIES["austin, tx"];
  const results = [
    {
      entity_id: city.id,
      name: city.name,
      type: "urn:entity",
      subtype: "urn:entity:locality",
      popularity: 0.95,
      properties: { geocode: { name: city.name, admin1_region: city.state, country_code: "US" } },
      tags: [],
    },
  ];
  return { success: true, results };
}

export function mockInsights(params = {}) {
  const filterType = params["filter.type"] || "urn:entity:place";
  const city = cityKey(params["signal.location.query"] || params["signal.interests.entities"] || "");
  const rows = ENTITIES[city]?.[filterType] || ENTITIES.austin[filterType] || ENTITIES.austin["urn:entity:place"];
  const entities = rows.map(([name, popularity], i) => entityFor(city, filterType, name, popularity, i));
  return { success: true, results: { entities } };
}

export function mockTags(params = {}) {
  return {
    success: true,
    results: {
      tags: [
        { id: "urn:tag:mock:dining", name: "Dining", type: "urn:tag:mock" },
        { id: "urn:tag:mock:music", name: "Music", type: "urn:tag:mock" },
      ],
    },
  };
}
