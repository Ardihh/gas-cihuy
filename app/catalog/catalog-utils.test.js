const test = require("node:test");
const assert = require("node:assert/strict");

const { filterAndSortProducts, getPriceValue } = require("./catalog-utils.js");

const sampleProducts = [
  { name: "Costume Gojo", category: "Anime", price: "Rp100.000", status: "available" },
  { name: "Costume Cloud", category: "Game", price: "Rp150.000", status: "available" },
  { name: "Wig Rem", category: "Aksesoris", price: "Rp60.000", status: "limited" },
];

test("parses Indonesian rental prices into sortable numbers", () => {
  assert.equal(getPriceValue("Rp150.000"), 150000);
});

test("filters by product name, category, and availability", () => {
  const result = filterAndSortProducts(sampleProducts, {
    query: "gojo",
    category: "Anime",
    status: "available",
  });

  assert.deepEqual(result.map((item) => item.name), ["Costume Gojo"]);
});

test("sorts filtered products from the lowest price", () => {
  const result = filterAndSortProducts(sampleProducts, { sort: "Harga terendah" });

  assert.deepEqual(result.map((item) => item.name), ["Wig Rem", "Costume Gojo", "Costume Cloud"]);
});
