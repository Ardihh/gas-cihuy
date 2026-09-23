import assert from "node:assert/strict";
import test from "node:test";

import { filterAndSortProducts, getPriceValue } from "./catalog-utils.mjs";

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
