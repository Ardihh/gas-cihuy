import assert from "node:assert/strict";
import test from "node:test";

import { getLandingRecommendations } from "./landing-utils.mjs";

function product(id, { category = "Anime", status = "available", stock = 4 } = {}) {
  return { id, name: `Product ${id}`, category, status, stock };
}

test("sorts available recommendations by numeric id and fills eight after unavailable items", () => {
  const products = [
    ...Array.from({ length: 9 }, (_, index) => {
      const id = 9 - index;
      return product(id, { status: id === 1 ? "unavailable" : "available" });
    }),
  ];

  const result = getLandingRecommendations(products);

  assert.deepEqual(result.map(({ id }) => id), [2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(result.length, 8);
  assert.ok(result.every(({ status }) => status === "available"));
});

test("returns a restocked low-id item to the first eight recommendations", () => {
  const products = Array.from({ length: 9 }, (_, index) => {
    const id = 9 - index;
    return product(id, { status: id === 1 ? "unavailable" : "available" });
  });

  products.find(({ id }) => id === 1).status = "available";

  assert.deepEqual(
    getLandingRecommendations(products).map(({ id }) => id),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
});

test("filters category and availability before filling the eight-item preview", () => {
  const products = [
    ...Array.from({ length: 10 }, (_, index) => {
      const id = 10 - index;
      return product(id, {
        category: id === 9 ? "Film" : "Game",
        status: id <= 2 ? "unavailable" : "available",
      });
    }),
    product(20, { category: "Film" }),
  ];

  const result = getLandingRecommendations(products, "Game");

  assert.deepEqual(result.map(({ id }) => id), [3, 4, 5, 6, 7, 8, 10]);
  assert.ok(result.every(({ category }) => category === "Game"));
});

test("uses status as the availability source, not stock", () => {
  const products = [
    product(1, { status: "available", stock: 0 }),
    product(2, { status: "unavailable", stock: 8 }),
  ];

  assert.deepEqual(getLandingRecommendations(products).map(({ id }) => id), [1]);
});
