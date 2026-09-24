import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCatalogSearchParams,
  canResetCatalogFilters,
  filterAndSortProducts,
  getPriceValue,
  hasActiveCatalogFilters,
  parseCatalogSearchParams,
} from "./catalog-utils.mjs";

const sampleProducts = [
  { name: "Costume Gojo", category: "Anime", pricePerDay: 100000, status: "available" },
  { name: "Costume Cloud", category: "Game", pricePerDay: 150000, status: "available" },
  { name: "Wig Rem", category: "Aksesoris", pricePerDay: 60000, status: "unavailable" },
];

test("uses normalized numeric pricePerDay values", () => {
  assert.equal(getPriceValue(150000), 150000);
  assert.throws(() => getPriceValue("Rp150.000"), /pricePerDay/);
});

test("filters by product name, category, and availability", () => {
  const result = filterAndSortProducts(sampleProducts, {
    query: "gojo",
    category: "Anime",
    status: "available",
  });

  assert.deepEqual(result.map((item) => item.name), ["Costume Gojo"]);
});

test("filters categories across products beyond the landing preview", () => {
  const products = Array.from({ length: 7 }, (_, index) => ({
    name: `Costume ${index + 1}`,
    category: index === 6 ? "Film" : "Anime",
    pricePerDay: 100000,
    status: "available",
  }));

  const result = filterAndSortProducts(products, { category: "Film" });

  assert.deepEqual(result.map((item) => item.name), ["Costume 7"]);
});

test("sorts filtered products from the lowest price", () => {
  const result = filterAndSortProducts(sampleProducts, { sort: "Harga terendah" });

  assert.deepEqual(result.map((item) => item.name), ["Wig Rem", "Costume Gojo", "Costume Cloud"]);
});

test("sorts filtered products from the highest price", () => {
  const result = filterAndSortProducts(sampleProducts, { sort: "Harga tertinggi" });

  assert.deepEqual(result.map((item) => item.name), ["Costume Cloud", "Costume Gojo", "Wig Rem"]);
});

test("does not treat unsupported statuses as live availability values", () => {
  const result = filterAndSortProducts(sampleProducts, { status: "legacy" });

  assert.deepEqual(result, []);
});

test("does not activate reset for a whitespace-only query", () => {
  assert.equal(hasActiveCatalogFilters({ query: "   " }), false);
});

test("activates reset for an effective search or non-default catalog control", () => {
  assert.equal(hasActiveCatalogFilters({ query: "gojo" }), true);
  assert.equal(hasActiveCatalogFilters({ category: "Anime" }), true);
  assert.equal(hasActiveCatalogFilters({ status: "available" }), true);
  assert.equal(hasActiveCatalogFilters({ sort: "Harga terendah" }), true);
});

test("does not offer reset when the catalog has no products", () => {
  assert.equal(canResetCatalogFilters({ hasProducts: false, hasFilters: true }), false);
  assert.equal(canResetCatalogFilters({ hasProducts: true, hasFilters: true }), true);
});

test("keeps whitespace-only queries unfiltered", () => {
  assert.deepEqual(filterAndSortProducts(sampleProducts, { query: "   " }), sampleProducts);
});

const catalogCategories = ["Semua", "Anime", "Game"];

test("restores valid catalog state from URL search params", () => {
  const state = parseCatalogSearchParams(
    new URLSearchParams("q=GENSHIN&category=Game&status=available&sort=Harga+terendah"),
    catalogCategories,
  );

  assert.deepEqual(state, {
    query: "GENSHIN",
    category: "Game",
    status: "available",
    sort: "Harga terendah",
  });
});

test("falls back to defaults for whitespace and invalid URL filter values", () => {
  const state = parseCatalogSearchParams(
    new URLSearchParams("q=%20%20%20&category=Unknown&status=limited&sort=price-asc"),
    catalogCategories,
  );

  assert.deepEqual(state, {
    query: "",
    category: "Semua",
    status: "Semua status",
    sort: "Relevan",
  });
});

test("serializes active state using only the compact catalog params", () => {
  const params = buildCatalogSearchParams(
    { query: "GENSHIN", category: "Game", status: "available", sort: "Harga terendah" },
    catalogCategories,
  );

  assert.equal(
    params.toString(),
    "q=GENSHIN&category=Game&status=available&sort=Harga+terendah",
  );
});

test("omits defaults, whitespace queries, and invalid catalog values from the URL", () => {
  const params = buildCatalogSearchParams(
    { query: "   ", category: "Unknown", status: "limited", sort: "price-asc" },
    catalogCategories,
  );

  assert.equal(params.toString(), "");
});
