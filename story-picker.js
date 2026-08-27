(function () {
  "use strict";

  function normalizedText(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function createQueuedImageLoader(options = {}) {
    const root = options.root || null;
    const maxConcurrent = Math.max(1, Number(options.maxConcurrent) || 3);
    const rootMargin = options.rootMargin || "240px";
    const queue = [];
    const tracked = new Set();
    let activeCount = 0;
    let observer = null;
    let generation = 0;

    function finish(image, failed, requestGeneration) {
      if (requestGeneration !== generation) {
        return;
      }
      activeCount = Math.max(0, activeCount - 1);
      tracked.delete(image);
      image.classList.remove("is-pending", "is-loading");
      image.classList.toggle("is-load-error", Boolean(failed));
      if (!failed) {
        image.classList.add("is-loaded");
      }
      pump();
    }

    function pump() {
      while (activeCount < maxConcurrent && queue.length) {
        const image = queue.shift();
        // Images can be queued while their card is still in a document fragment.
        // Setting src before insertion is valid and avoids leaving eager cards stuck.
        if (!image || image.dataset.loadStarted === "true") {
          continue;
        }
        const source = image.dataset.lazySrc;
        if (!source) {
          continue;
        }
        image.dataset.loadStarted = "true";
        image.classList.remove("is-pending");
        image.classList.add("is-loading");
        activeCount += 1;
        const requestGeneration = generation;
        image.addEventListener("load", () => finish(image, false, requestGeneration), { once: true });
        image.addEventListener("error", () => finish(image, true, requestGeneration), { once: true });
        image.src = source;
      }
    }

    function enqueue(image) {
      if (!image || image.dataset.queued === "true" || image.dataset.loadStarted === "true") {
        return;
      }
      image.dataset.queued = "true";
      if (observer) {
        observer.unobserve(image);
      }
      queue.push(image);
      pump();
    }

    function ensureObserver() {
      if (observer || typeof IntersectionObserver !== "function") {
        return;
      }
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            enqueue(entry.target);
          }
        });
      }, { root, rootMargin });
    }

    function watch(image, source, eager) {
      if (!image || !source) {
        return;
      }
      image.alt = "";
      image.decoding = "async";
      image.loading = eager ? "eager" : "lazy";
      image.fetchPriority = eager ? "high" : "low";
      image.dataset.lazySrc = source;
      image.classList.add("is-pending");
      tracked.add(image);
      ensureObserver();
      if (eager || !observer) {
        enqueue(image);
      } else {
        observer.observe(image);
      }
    }

    function clear() {
      generation += 1;
      if (observer) {
        tracked.forEach((image) => observer.unobserve(image));
      }
      queue.length = 0;
      tracked.clear();
      activeCount = 0;
    }

    return { watch, clear };
  }

  function createCharacterBrowser(options) {
    const container = options.container;
    const moreContainer = options.moreContainer;
    const moreButton = moreContainer ? moreContainer.querySelector("button") : null;
    const pageSize = Math.max(12, Number(options.pageSize) || 48);
    const imageLoader = createQueuedImageLoader({
      root: options.scrollRoot,
      maxConcurrent: options.imageConcurrency || 4,
      rootMargin: options.rootMargin || "280px"
    });
    let items = [];
    let filteredItems = [];
    let renderedCount = 0;
    let query = "";
    let searchTimer = null;
    let moreObserver = null;

    function getSearchText(item) {
      if (typeof options.getSearchText === "function") {
        return options.getSearchText(item);
      }
      return [item.name, item.originalName, item.id, item.fileName, item.collectionNo, item.className].join(" ");
    }

    function createCard(item, index) {
      const button = document.createElement("button");
      button.className = "story-picker-card";
      button.type = "button";
      button.addEventListener("click", () => options.onSelect(item));

      const image = document.createElement("img");
      // The picker owns a bounded page (32 on mobile). Load that page through
      // the queue instead of relying on a WebView IntersectionObserver root;
      // some Android WebViews leave all cards in the pending state otherwise.
      imageLoader.watch(image, options.getImage(item), true);

      const copy = document.createElement("span");
      copy.className = "story-picker-card-copy";
      const title = document.createElement("strong");
      title.textContent = options.getTitle(item);
      const meta = document.createElement("small");
      meta.textContent = options.getMeta(item);
      copy.append(title, meta);
      button.append(image, copy);
      return button;
    }

    function updateSummary() {
      const hasMore = renderedCount < filteredItems.length;
      if (moreContainer) {
        moreContainer.hidden = !hasMore;
      }
      if (typeof options.onResults === "function") {
        options.onResults(renderedCount, filteredItems.length);
      }
    }

    function appendNextPage() {
      if (renderedCount >= filteredItems.length) {
        updateSummary();
        return;
      }
      const nextCount = Math.min(renderedCount + pageSize, filteredItems.length);
      const fragment = document.createDocumentFragment();
      for (let index = renderedCount; index < nextCount; index += 1) {
        fragment.append(createCard(filteredItems[index], index));
      }
      container.append(fragment);
      renderedCount = nextCount;
      updateSummary();
    }

    function showLoading(count = 12) {
      clearTimeout(searchTimer);
      imageLoader.clear();
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < count; index += 1) {
        const card = document.createElement("div");
        card.className = "story-picker-card story-picker-card-skeleton";
        card.setAttribute("aria-hidden", "true");
        card.append(document.createElement("span"), document.createElement("span"));
        fragment.append(card);
      }
      container.replaceChildren(fragment);
      if (moreContainer) {
        moreContainer.hidden = true;
      }
    }

    function applyQuery() {
      const normalizedQuery = normalizedText(query);
      filteredItems = normalizedQuery
        ? items.filter((item) => normalizedText(getSearchText(item)).includes(normalizedQuery))
        : items;
      imageLoader.clear();
      container.replaceChildren();
      renderedCount = 0;
      appendNextPage();
    }

    function setItems(nextItems, nextQuery = "") {
      clearTimeout(searchTimer);
      items = Array.isArray(nextItems) ? nextItems : [];
      query = nextQuery;
      applyQuery();
      return filteredItems;
    }

    function setQuery(nextQuery) {
      query = nextQuery;
      clearTimeout(searchTimer);
      imageLoader.clear();
      container.replaceChildren();
      renderedCount = 0;
      if (moreContainer) {
        moreContainer.hidden = true;
      }
      if (typeof options.onResults === "function") {
        options.onResults(0, 0);
      }
      searchTimer = window.setTimeout(applyQuery, 140);
    }

    function clear() {
      clearTimeout(searchTimer);
      imageLoader.clear();
      container.replaceChildren();
      items = [];
      filteredItems = [];
      renderedCount = 0;
      updateSummary();
    }

    if (moreButton) {
      moreButton.addEventListener("click", appendNextPage);
    }
    if (moreContainer && typeof IntersectionObserver === "function") {
      moreObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          appendNextPage();
        }
      }, { root: options.scrollRoot, rootMargin: "320px" });
      moreObserver.observe(moreContainer);
    }

    return {
      setItems,
      setQuery,
      appendNextPage,
      clear,
      showLoading,
      getFilteredItems: () => filteredItems,
      getRenderedCount: () => renderedCount
    };
  }

  window.FgoStoryPicker = {
    createCharacterBrowser,
    createQueuedImageLoader
  };
})();
