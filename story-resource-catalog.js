(function () {
  "use strict";

  const EMPTY_CATALOG = Object.freeze({
    version: 1,
    region: "",
    figures: Object.freeze({}),
    backgrounds: Object.freeze({}),
    sourceCategoryLabels: Object.freeze({})
  });
  const catalogPromises = new Map();

  function normalizeList(value) {
    return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
  }

  function getSourceSummary(entry) {
    const sources = Array.isArray(entry?.sources) ? entry.sources : [];
    if (!sources.length) return "尚未建立剧情索引";
    if (sources.length === 1) return sources[0].name;
    return `${sources[0].name} 等 ${sources.length} 处`;
  }

  function getSearchText(entry) {
    const sources = Array.isArray(entry?.sources) ? entry.sources : [];
    return [
      entry?.name,
      ...normalizeList(entry?.aliases),
      ...sources.flatMap((source) => [source.name, source.id]),
      ...normalizeList(entry?.categories)
    ].filter(Boolean).join(" ");
  }

  function getCategories(entry) {
    const categories = normalizeList(entry?.categories);
    return categories.length ? categories : ["unindexed"];
  }

  async function load(url, region) {
    if (String(region || "").toUpperCase() !== "JP") return EMPTY_CATALOG;
    const key = `${url}:${region}`;
    if (!catalogPromises.has(key)) {
      catalogPromises.set(key, fetch(url, { cache: "default" })
        .then((response) => {
          if (!response.ok) throw new Error(`剧情资源目录返回 ${response.status}`);
          return response.json();
        })
        .then((catalog) => catalog?.region === region ? catalog : EMPTY_CATALOG)
        .catch(() => EMPTY_CATALOG));
    }
    return catalogPromises.get(key);
  }

  function enrichFigure(item, catalog) {
    const entry = catalog?.figures?.[String(item.fileName)] || null;
    return {
      ...item,
      name: entry?.name || `未识别人物立绘 ${item.fileName}`,
      aliases: normalizeList(entry?.aliases),
      storySources: Array.isArray(entry?.sources) ? entry.sources : [],
      sourceCategories: getCategories(entry),
      sourceSummary: getSourceSummary(entry),
      catalogMatched: Boolean(entry?.name),
      catalogSearchText: getSearchText(entry)
    };
  }

  function enrichBackground(item, catalog) {
    const entry = catalog?.backgrounds?.[String(item.fileName)] || null;
    return {
      ...item,
      storySources: Array.isArray(entry?.sources) ? entry.sources : [],
      sourceCategories: getCategories(entry),
      sourceSummary: getSourceSummary(entry),
      catalogMatched: Boolean(entry),
      catalogSearchText: getSearchText(entry)
    };
  }

  window.FgoStoryResourceCatalog = {
    EMPTY_CATALOG,
    load,
    enrichFigure,
    enrichBackground,
    getSourceSummary,
    getSearchText
  };
})();
