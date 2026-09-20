function getPriceValue(price) {
  return Number(String(price).replace(/\D/g, ""));
}

function filterAndSortProducts(items, options = {}) {
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
    const matchesStatus = status === "Semua status" || item.status === status;
    return matchesQuery && matchesCategory && matchesStatus;
  });

  if (sort === "Harga terendah") {
    return [...filtered].sort((a, b) => getPriceValue(a.price) - getPriceValue(b.price));
  }

  if (sort === "Harga tertinggi") {
    return [...filtered].sort((a, b) => getPriceValue(b.price) - getPriceValue(a.price));
  }

  return filtered;
}

module.exports = { filterAndSortProducts, getPriceValue };
