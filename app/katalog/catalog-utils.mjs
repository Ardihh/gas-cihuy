const SUPPORTED_STATUSES = new Set(["available", "unavailable"]);
const SUPPORTED_SORTS = new Set(["Relevan", "Harga terendah", "Harga tertinggi"]);

export function parseCatalogSearchParams(searchParams, categories = []) {
  const query = searchParams.get("q") ?? "";
  const requestedCategory = searchParams.get("category");
  const requestedStatus = searchParams.get("status");
  const requestedSort = searchParams.get("sort");

  return {
    query: query.trim() ? query : "",
    category: requestedCategory && categories.includes(requestedCategory)
      ? requestedCategory
      : "Semua",
    status: SUPPORTED_STATUSES.has(requestedStatus) ? requestedStatus : "Semua status",
    sort: SUPPORTED_SORTS.has(requestedSort) ? requestedSort : "Relevan",
  };
}

export function buildCatalogSearchParams(state, categories = []) {
  const params = new URLSearchParams();
  const query = typeof state.query === "string" ? state.query : "";
  if (query.trim()) {
    params.set("q", query);
  }

  if (state.category !== "Semua" && categories.includes(state.category)) {
    params.set("category", state.category);
  }

  if (SUPPORTED_STATUSES.has(state.status)) {
    params.set("status", state.status);
  }

  if (SUPPORTED_SORTS.has(state.sort) && state.sort !== "Relevan") {
    params.set("sort", state.sort);
  }

  return params;
}

export function hasActiveCatalogFilters(options = {}) {
  const {
    query = "",
    category = "Semua",
    status = "Semua status",
    sort = "Relevan",
  } = options;

  return Boolean(
    query.trim() || category !== "Semua" || status !== "Semua status" || sort !== "Relevan",
  );
}

export function canResetCatalogFilters({ hasProducts, hasFilters } = {}) {
  return Boolean(hasProducts && hasFilters);
}

export function getPriceValue(pricePerDay) {
  if (typeof pricePerDay !== "number" || !Number.isFinite(pricePerDay)) {
    throw new TypeError("Catalog pricePerDay must be a finite number.");
  }

  return pricePerDay;
}

export function filterAndSortProducts(items, options = {}) {
  const {
    query = "",
    category = "Semua",
    status = "Semua status",
    sort = "Relevan",
  } = options;
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesQuery = !normalizedQuery || item.name.toLowerCase().includes(normalizedQuery);
    const matchesCategory = category === "Semua" || item.category === category;
    const matchesStatus = status === "Semua status"
      ? true
      : SUPPORTED_STATUSES.has(status) && item.status === status;

    return matchesQuery && matchesCategory && matchesStatus;
  });

  if (sort === "Harga terendah") {
    return [...filtered].sort((a, b) => getPriceValue(a.pricePerDay) - getPriceValue(b.pricePerDay));
  }

  if (sort === "Harga tertinggi") {
    return [...filtered].sort((a, b) => getPriceValue(b.pricePerDay) - getPriceValue(a.pricePerDay));
  }

  return filtered;
}

