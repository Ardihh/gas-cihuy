const SUPPORTED_STATUSES = new Set(["available", "unavailable"]);

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

